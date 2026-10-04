// La sala de espera que usan todos los juegos con salas: el código grande (copiar y compartir), los cuatro puestos
// con la carita o el retrato de cada uno, su nombre y si está listo, el botón «Listo» y, para el anfitrión,
// «Empezar» cuando todos están listos. Cada juego le pone su tema (`tema`: casa, burbujas u oscuro) y lo suyo
// (botones extra, la línea de detalle de cada jugador). Al empezar, el anfitrión cierra la entrada y a todos les
// llegan los datos de arranque que él armó (`alEmpezar`).
//
//   const e = esperarEnSala({ sala, titulo: 'Sangre y Ceniza', tema: 'oscuro', alEmpezar: () => config });
//   const r = await e.resultado;      // { que: 'empezar', datos } o { que: 'salir', motivo? }
import './espera.css';
import { caritaSvg } from './carita';
import { COLOR_PUESTO } from './sala';
import type { JugadorSala, Sala } from './tipos';

export interface OpcionesEspera {
  sala: Sala;
  /** El nombre del juego (arriba). */
  titulo: string;
  /** Una línea corta debajo del título. */
  subtitulo?: string;
  tema?: 'casa' | 'burbujas' | 'oscuro';
  contenedor?: HTMLElement;
  /** Retrato de cada jugador (HTML); si no, su carita con sus colores. */
  retrato?: (j: JugadorSala) => string;
  /** Lo que lleva cada uno (el disfraz, la clase…), debajo del nombre. */
  detalle?: (j: JugadorSala) => string;
  /** Botones propios del juego (cambiar disfraz, escoger clase…). */
  extras?: { id: string; texto: string; alTocar: () => void }[];
  /** Cuántos hacen falta para empezar (2 por defecto). */
  minimo?: number;
  /** Lo que el anfitrión les manda a todos al empezar (la configuración de la partida). */
  alEmpezar?: () => unknown | Promise<unknown>;
  /** Texto para compartir el código. */
  invitacion?: (codigo: string) => string;
}

export interface ResultadoEspera {
  que: 'empezar' | 'salir';
  datos?: unknown;
  /** Por qué se salió (si no fue por su gusto): «Javier cerró la sala.» */
  motivo?: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** El mensaje con que el anfitrión arranca la partida (los juegos no lo usan directo). */
export const MSJ_EMPEZAR = 'espera:empezar';

export function esperarEnSala(o: OpcionesEspera) {
  const { sala } = o;
  const raiz = document.createElement('section');
  raiz.className = `sala-espera tema-${o.tema ?? 'casa'}`;
  (o.contenedor ?? document.body).append(raiz);
  requestAnimationFrame(() => raiz.classList.add('visible'));
  const minimo = o.minimo ?? 2;
  let listo = sala.soyAnfitrion;
  let cerrado = false;
  let resolver!: (r: ResultadoEspera) => void;
  const resultado = new Promise<ResultadoEspera>((r) => (resolver = r));
  // Al volver a la sala después de una partida, nadie está listo todavía (el anfitrión sí: él decide cuándo)
  sala.ponerDatos({ listo });
  if (sala.soyAnfitrion) sala.cerrarEntrada(false);

  const quitar: (() => void)[] = [];
  const terminar = (r: ResultadoEspera) => {
    if (cerrado) return;
    cerrado = true;
    for (const q of quitar) q();
    raiz.classList.remove('visible');
    setTimeout(() => raiz.remove(), 350);
    resolver(r);
  };
  quitar.push(
    sala.alCambiar(() => pintar()),
    sala.alCorte(() => pintar()),
    sala.alFin((_m, texto) => terminar({ que: 'salir', motivo: texto })),
    sala.al(MSJ_EMPEZAR, (datos) => {
      if (!sala.soyAnfitrion) terminar({ que: 'empezar', datos });
    }),
  );

  const codigo = sala.codigo.split('').map((c) => `<b>${c}</b>`).join('');
  const invitacion = o.invitacion?.(sala.codigo) ?? `¡Ven a jugar ${o.titulo} conmigo! Abre «Nuestro Hogar», toca «Unirme con un código» y escribe: ${sala.codigo}`;
  raiz.innerHTML = `<div class="se-marco">
    <div class="se-izq">
      <h2>${esc(o.titulo)}</h2>
      ${o.subtitulo ? `<p class="se-sub">${esc(o.subtitulo)}</p>` : ''}
      <ol class="se-pasos"><li><b>1</b>Comparte el código</li><li><b>2</b>Cada uno toca «Estoy listo»</li><li><b>3</b>${sala.soyAnfitrion ? 'Tú' : 'Quien tiene la sala'} arranca la partida</li></ol>
      <div class="se-codigo-caja">
        <small>Código de la sala</small>
        <div class="se-codigo" aria-label="Código ${sala.codigo.split('').join(' ')}">${codigo}</div>
        <div class="se-fila">
          <button class="se-boton" data-a="copiar">📋 Copiar</button>
          <button class="se-boton" data-a="compartir">📤 Compartir</button>
        </div>
        <p class="se-pista">Los demás entran con <b>«Unirme con un código»</b>. Hasta ${sala.max} jugadores.</p>
      </div>
    </div>
    <div class="se-der">
      <ul class="se-puestos"></ul>
      <div class="se-barra">
        <button class="se-boton se-salir" data-a="salir">← Salir</button>
        <span class="se-extras">${(o.extras ?? []).map((x) => `<button class="se-boton" data-x="${esc(x.id)}">${esc(x.texto)}</button>`).join('')}</span>
        <button class="se-boton se-principal" data-a="principal"></button>
      </div>
    </div>
    <div class="se-aviso" role="status"></div>
  </div>`;

  const aviso = (t: string) => {
    const a = raiz.querySelector<HTMLElement>('.se-aviso')!;
    a.textContent = t;
    a.classList.remove('sale');
    void a.offsetWidth;
    a.classList.add('sale');
  };

  function puesto(j: JugadorSala | undefined, k: number) {
    const color = COLOR_PUESTO[k] ?? '#999';
    if (!j) {
      return `<li class="se-puesto vacio" style="--c:${color}"><b class="se-num">${k + 1}</b><span class="se-retrato"><i class="se-puntos"><u></u><u></u><u></u></i></span>
        <span class="se-info"><span class="se-nombre">Esperando…</span><span class="se-estado">Puesto libre</span></span></li>`;
    }
    const yo = j.id === sala.yo.id;
    const conectado = sala.conectado(j.id);
    const esListo = !!j.datos?.listo || j.puesto === 0;
    const retrato = o.retrato?.(j) || caritaSvg(j.aspecto, 58, esListo ? 'feliz' : 'normal');
    const det = o.detalle?.(j) ?? '';
    const marcas = `${j.puesto === 0 ? '<em class="se-marca corona">👑 Anfitrión</em>' : ''}${yo ? '<em class="se-marca tu">Tú</em>' : ''}`;
    const estado = !conectado ? '📶 Sin conexión…' : j.puesto === 0 ? 'Arranca la partida' : esListo ? '✓ ¡Listo!' : 'Alistándose…';
    return `<li class="se-puesto ${esListo ? 'listo' : ''} ${conectado ? '' : 'cortado'} ${yo ? 'yo' : ''}" style="--c:${color}">
      <b class="se-num">${k + 1}</b><span class="se-retrato">${retrato}</span>
      <span class="se-info"><span class="se-nombre">${esc(j.nombre)}</span>${marcas ? `<span class="se-marcas">${marcas}</span>` : ''}
      ${det ? `<span class="se-detalle">${det}</span>` : ''}
      <span class="se-estado">${estado}</span></span></li>`;
  }

  function pintar() {
    if (cerrado) return;
    const js = sala.jugadores;
    // Los ocupados en su orden de llegada y después los puestos libres (cada puesto con su color)
    const ocupados = js.filter((j) => j.puesto >= 0).sort((x, y) => x.puesto - y.puesto);
    const usados = new Set(ocupados.map((j) => j.puesto));
    const libres = [0, 1, 2, 3].slice(0, sala.max).filter((k) => !usados.has(k)).slice(0, Math.max(0, sala.max - ocupados.length));
    const filas = [...ocupados.map((j) => puesto(j, j.puesto)), ...libres.map((k) => puesto(undefined, k))];
    raiz.querySelector('.se-puestos')!.innerHTML = filas.join('');
    const b = raiz.querySelector<HTMLButtonElement>('[data-a="principal"]')!;
    if (sala.soyAnfitrion) {
      const otros = js.filter((j) => j.id !== sala.yo.id);
      const faltan = otros.filter((j) => !j.datos?.listo || !sala.conectado(j.id));
      const pocos = js.length < minimo;
      b.disabled = pocos || faltan.length > 0;
      b.className = 'se-boton se-principal empezar';
      b.innerHTML = pocos ? 'Esperando amigos…' : faltan.length ? `Esperando a ${esc(faltan.map((j) => j.nombre).join(', '))}` : '▶ ¡Empezar!';
    } else {
      b.disabled = false;
      b.className = `se-boton se-principal ${listo ? 'activo' : ''}`;
      b.innerHTML = listo ? '✓ ¡Listo! (tocar para esperar)' : '¡Estoy listo!';
    }
  }

  raiz.addEventListener('click', async (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-a], [data-x]');
    if (!el || cerrado) return;
    const x = el.dataset.x;
    if (x) {
      o.extras?.find((e) => e.id === x)?.alTocar();
      return;
    }
    switch (el.dataset.a) {
      case 'copiar':
        if (await copiar(sala.codigo)) aviso('¡Código copiado!');
        else aviso(`El código es ${sala.codigo}`);
        break;
      case 'compartir': {
        const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
        if (nav.share) {
          try {
            await nav.share({ title: o.titulo, text: invitacion });
          } catch {
            /* lo cerró */
          }
        } else if (await copiar(invitacion)) aviso('Invitación copiada: pégala en WhatsApp');
        break;
      }
      case 'salir':
        sala.salir();
        terminar({ que: 'salir' });
        break;
      case 'principal':
        if (sala.soyAnfitrion) {
          if ((el as HTMLButtonElement).disabled) return;
          (el as HTMLButtonElement).disabled = true;
          const datos = await o.alEmpezar?.();
          sala.cerrarEntrada(true);
          sala.mandar(MSJ_EMPEZAR, datos ?? null);
          terminar({ que: 'empezar', datos });
        } else {
          listo = !listo;
          sala.ponerDatos({ listo });
          pintar();
        }
        break;
    }
  });
  pintar();
  return {
    raiz,
    resultado,
    /** Vuelve a pintar (por ejemplo, cambió el disfraz escogido). */
    repintar: pintar,
    aviso,
    cerrar: () => terminar({ que: 'salir' }),
  };
}

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const t = document.createElement('textarea');
    t.value = texto;
    t.style.position = 'fixed';
    t.style.opacity = '0';
    document.body.append(t);
    t.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    t.remove();
    return ok;
  }
}

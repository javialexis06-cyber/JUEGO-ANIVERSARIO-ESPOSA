// Cocinar juntos de 2 a 4 en una sala (src/salas/, docs/salas.md): Javier y Laura (la invitación le llega a la casa
// del otro con el código) o con amigos (comparten el código). Quien abre la sala es el dueño de la cocina: escoge el
// restaurante en la sala de espera y su día, su rango y sus mejoras son los de todos. Cada uno toca «Estoy listo»,
// el anfitrión arranca y se cocina el mismo día cada uno en su celular (linea.ts). Al final el anfitrión puede
// seguir con otro día o volver con todos a la sala de espera. Con amigos todo va en modo neutro.
import { caritaSvg } from '../../salas/carita';
import { esperarEnSala } from '../../salas/espera';
import { crearSala, normalizarCodigo, unirseSala, usarSalasLocales } from '../../salas/sala';
import type { JugadorSala, OpcionesSala, Sala } from '../../salas/tipos';
import type { Rol } from '../modelo';
import { chefAmigoListo, imagenChefAmigo, prepararChefAmigo } from './chef_amigo';
import { jugarCocina } from './index';
import { cargarRecortes } from './sprites';
import { iconoHTML } from './pantallas';
import {
  type ConfigCocina, esReceta, type JugadorCocina, nombreRango, type ProgresoCocina, rangoDe, type RecetaId, RESTAURANTES, type ResultadoDia,
} from './tipos';

export interface OpcionesSalaCocina {
  /** Quién soy en la sala: Javier o Laura (con su nombre de la casa) o el amigo con su perfil. */
  yo: NonNullable<OpcionesSala['yo']> & { tipo: JugadorSala['tipo'] };
  /** El muñeco de base de quien cocina. */
  rol: Rol;
  /** El restaurante con el que se abre la sala (el anfitrión lo cambia en la sala de espera). */
  receta: RecetaId;
  /** Entrar a la sala de otro con su código (si no, se abre una). */
  unirse?: string;
  /** Al abrirla: mandar la invitación con el código (a la casa de la pareja). */
  invitar?: (codigo: string, receta: RecetaId) => Promise<void>;
  /** A quién le llegó la invitación (para el letrero de la sala de espera). */
  invitado?: string;
  progresoDe: (r: RecetaId) => ProgresoCocina;
  guardar: (r: RecetaId, p: ProgresoCocina, dia?: ResultadoDia) => Promise<void>;
  /** La pareja que llega a comer (solo si cocinan Javier y Laura sin amigos). */
  pareja?: { rol: Rol; nombre: string } | null;
  /** El día deja monedas y platos para la casa (Javier y Laura en su casa, siendo anfitriones). */
  premioCasa?: boolean;
  textoSalir: string;
  /** La casa local de prueba (sin internet): salas entre pestañas. */
  local?: boolean;
}

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const restaurante = (id: unknown) => RESTAURANTES.find((r) => r.id === id) ?? RESTAURANTES[0];

/** Un aviso en una tarjeta de la cocina (errores de la sala: llena, ya empezó, no existe…). */
export function avisoCocina(texto: string, titulo = '¡Uy!'): Promise<void> {
  return new Promise((ok) => {
    const c = document.createElement('section');
    c.className = 'cocina cocina-aviso visible';
    c.innerHTML = `<div class="cocina-capa"><div class="cocina-tarjeta"><h2>${esc(titulo)}</h2><p>${esc(texto)}</p>
      <div class="botones"><button class="boton-cocina principal">Listo</button></div></div></div>`;
    document.body.append(c);
    c.querySelector('button')!.addEventListener('click', () => {
      c.remove();
      ok();
    });
  });
}

/** Pide el código de una sala (5 letras y números); null si se cancela. */
export function pedirCodigoCocina(): Promise<string | null> {
  return new Promise((ok) => {
    const c = document.createElement('section');
    c.className = 'cocina cocina-codigo visible';
    c.innerHTML = `<div class="cocina-capa"><form class="cocina-tarjeta" autocomplete="off"><h2>🔑 Unirme con un código</h2>
      <p>El que abrió la cocina te lo pasa (5 letras y números)</p>
      <input name="c" maxlength="7" autocapitalize="characters" spellcheck="false" placeholder="ABCDE" aria-label="Código de la sala" enterkeyhint="go">
      <p class="error" role="status"></p>
      <div class="botones"><button type="button" class="boton-cocina" data-c="no">Cancelar</button><button class="boton-cocina principal">Entrar</button></div></form></div>`;
    document.body.append(c);
    const input = c.querySelector('input')!;
    input.addEventListener('input', () => (input.value = normalizarCodigo(input.value)));
    setTimeout(() => input.focus(), 60);
    const fin = (v: string | null) => {
      c.remove();
      ok(v);
    };
    c.querySelector('[data-c="no"]')!.addEventListener('click', () => fin(null));
    c.querySelector('form')!.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = normalizarCodigo(input.value);
      if (v.length !== 5) {
        c.querySelector('.error')!.textContent = 'El código tiene 5 letras y números.';
        return;
      }
      fin(v);
    });
  });
}

/** Escoger el restaurante (con el día y el rango de cada uno); null si se cancela. */
export async function elegirRestaurante(progresoDe: (r: RecetaId) => ProgresoCocina, actual?: RecetaId): Promise<RecetaId | null> {
  await cargarRecortes();
  return new Promise((ok) => {
    const c = document.createElement('section');
    c.className = 'cocina cocina-elegir visible';
    c.innerHTML = `<div class="cocina-capa"><div class="cocina-tarjeta"><h2>¿Qué restaurante abrimos?</h2>
      <ul class="cz-restaurantes">${RESTAURANTES.map((r) => {
        const p = progresoDe(r.id);
        return `<li><button class="cz-restaurante ${r.id === actual ? 'si' : ''}" data-r="${r.id}">${iconoHTML(r.icono, 54) || `<span class="cz-emoji">${r.emoji}</span>`}
          <b>${r.nombre}</b><small>Día ${p.dia} · ${nombreRango(rangoDe(p.xp))}</small></button></li>`;
      }).join('')}</ul>
      <div class="botones"><button class="boton-cocina" data-r="">Cancelar</button></div></div></div>`;
    document.body.append(c);
    c.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-r]');
      if (!b) return;
      c.remove();
      ok(esReceta(b.dataset.r) ? b.dataset.r : null);
    });
  });
}

/** Lo que cada uno lleva en la sala: los recortes del chef (Javier y Laura) o el del amigo hecho aquí. */
function retratoChef(j: JugadorSala): string {
  const estilo = 'style="object-fit:cover;object-position:50% 6%"';
  if (j.tipo !== 'amigo') return `<img src="./cocina/gente/${j.tipo}_chef_feliz.webp" alt="" ${estilo}>`;
  if (chefAmigoListo(j.aspecto)) return `<img src="${imagenChefAmigo(j.aspecto, 'feliz').src}" alt="" ${estilo}>`;
  return caritaSvg(j.aspecto, 58, 'feliz');
}

/** Lo que manda el anfitrión al empezar, revisado (nunca se confía a ciegas). */
function configSegura(x: unknown, sala: Sala): ConfigCocina | null {
  const c = x as Partial<ConfigCocina> | null;
  if (!c || !esReceta(c.receta) || !Array.isArray(c.jugadores) || !c.jugadores.length || c.jugadores.length > 4) return null;
  const num = (v: unknown, d: number, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : d);
  const mejoras: Record<string, number> = {};
  if (c.mejoras && typeof c.mejoras === 'object') for (const [k, v] of Object.entries(c.mejoras)) if (/^[a-z_]{1,24}$/.test(k)) mejoras[k] = num(v, 0, 0, 9);
  const jugadores: JugadorCocina[] = c.jugadores.map((j, i) => {
    const deSala = sala.jugadores.find((x) => x.id === j?.id);
    const tipo = j?.tipo === 'el' || j?.tipo === 'ella' ? j.tipo : 'amigo';
    const rol: Rol = tipo === 'amigo' ? (j?.rol === 'ella' ? 'ella' : 'el') : tipo;
    return {
      id: String(j?.id ?? `j${i}`), nombre: String(j?.nombre ?? deSala?.nombre ?? 'Chef').slice(0, 16), tipo, rol,
      aspecto: tipo === 'amigo' ? deSala?.aspecto ?? (j?.aspecto && typeof j.aspecto === 'object' ? j.aspecto : { cuerpo: rol }) : undefined,
      puesto: num(j?.puesto, i, 0, 3),
    };
  });
  return { receta: c.receta, dia: num(c.dia, 1, 1, 9999), rango: num(c.rango, 1, 1, 99), mejoras, jugadores };
}

/** Quién cocina, como lo ve la cocina (en el orden de los puestos). */
function jugadoresDe(sala: Sala): JugadorCocina[] {
  return sala.jugadores
    .filter((j) => j.puesto >= 0)
    .sort((a, b) => a.puesto - b.puesto)
    .map((j) => {
      const rol: Rol = j.tipo === 'amigo' ? j.aspecto.cuerpo : j.tipo;
      return { id: j.id, nombre: j.nombre, tipo: j.tipo, rol, aspecto: j.tipo === 'amigo' ? j.aspecto : undefined, puesto: j.puesto };
    });
}

/** Abre (o entra a) una sala de cocina y cocina con los demás hasta que se salga. */
export async function cocinarEnSala(o: OpcionesSalaCocina): Promise<void> {
  usarSalasLocales(!!o.local);
  const carga = document.createElement('section');
  carga.className = 'cocina cocina-carga visible';
  carga.innerHTML = `<div class="cocina-capa"><div class="cocina-tarjeta pareja"><h2>${o.unirse ? 'Entrando a la cocina' : 'Abriendo la cocina'}… <span class="latido">👨‍🍳</span></h2><p>Un momentico.</p></div></div>`;
  document.body.append(carga);
  let sala: Sala;
  try {
    sala = o.unirse ? await unirseSala(o.unirse, 'cocina', o.yo) : await crearSala({ juego: 'cocina', max: 4, yo: o.yo });
  } catch (e) {
    carga.remove();
    await avisoCocina(e instanceof Error ? e.message : 'No se pudo abrir la sala.');
    return;
  }
  carga.remove();
  let receta = o.receta;
  if (o.invitar && !o.unirse) void o.invitar(sala.codigo, receta).catch(() => undefined);
  let acabada = false;
  const quitarFin = sala.alFin(() => (acabada = true));
  // Los chefs de los amigos se van haciendo apenas entran (en la sala de espera se ve su carita mientras tanto)
  const prepararAmigos = (repintar: () => void) => {
    for (const j of sala.jugadores) if (j.tipo === 'amigo' && !chefAmigoListo(j.aspecto)) void prepararChefAmigo(j.aspecto).then(repintar);
  };
  try {
    for (;;) {
      const p = o.progresoDe(receta);
      sala.ponerDatos({ receta, dia: p.dia, rango: rangoDe(p.xp), jugando: false });
      const e = esperarEnSala({
        sala,
        titulo: 'Cocina de chef',
        subtitulo: o.invitar && o.invitado
          ? `Le llegó la invitación a ${o.invitado}: cuando la acepte, entra. Con el código también entran amigos.`
          : 'Hasta 4 en la misma cocina: más invitados por cada uno, y las propinas son de todos.',
        tema: 'casa',
        retrato: retratoChef,
        detalle: (j) => {
          if (j.puesto !== 0) return '';
          const r = restaurante(j.datos?.receta);
          return `${r.emoji} ${esc(r.nombre)} · día ${Number(j.datos?.dia) || 1}`;
        },
        extras: sala.soyAnfitrion
          ? [{
              id: 'restaurante', texto: '🍳 Restaurante', alTocar: async () => {
                const r = await elegirRestaurante(o.progresoDe, receta);
                if (!r || r === receta) return;
                receta = r;
                const q = o.progresoDe(r);
                sala.ponerDatos({ receta: r, dia: q.dia, rango: rangoDe(q.xp) });
                e.repintar();
                e.aviso(`Hoy se cocina en ${restaurante(r).nombre}`);
              },
            }]
          : [],
        minimo: 2,
        alEmpezar: (): ConfigCocina => {
          const q = o.progresoDe(receta);
          return { receta, dia: q.dia, rango: rangoDe(q.xp), mejoras: { ...q.mejoras }, jugadores: jugadoresDe(sala) };
        },
        invitacion: (c) => `¡Ven a cocinar conmigo! Abre «Nuestro Hogar», entra a la cocina de chef, toca «Unirme con un código» y escribe: ${c}`,
      });
      e.raiz.classList.add('cocina-espera');
      prepararAmigos(() => e.repintar());
      const quitarCambio = sala.alCambiar(() => prepararAmigos(() => e.repintar()));
      const r = await e.resultado;
      quitarCambio();
      if (r.que !== 'empezar') {
        if (r.motivo) await avisoCocina(r.motivo, 'Se cerró la cocina');
        break;
      }
      const config = configSegura(r.datos, sala);
      const yo = config?.jugadores.find((j) => j.id === sala.yo.id);
      if (!config || !yo) {
        await avisoCocina('No se pudo entrar a la cocina.');
        break;
      }
      receta = config.receta;
      sala.ponerDatos({ jugando: true, listo: false });
      const neutro = sala.hayAmigos || yo.tipo === 'amigo' || config.jugadores.some((j) => j.tipo === 'amigo');
      const como = await jugarCocina({
        rol: o.rol,
        receta: config.receta,
        progreso: o.progresoDe(config.receta),
        yo,
        pareja: neutro ? null : o.pareja ?? null,
        neutro,
        premioCasa: o.premioCasa,
        textoSalir: o.textoSalir,
        guardar: (q, dia) => o.guardar(config.receta, q, dia),
        linea: { sala, config },
      });
      sala.ponerDatos({ jugando: false });
      if (como === 'salir' || acabada) break;
    }
  } finally {
    quitarFin();
    sala.salir();
  }
}

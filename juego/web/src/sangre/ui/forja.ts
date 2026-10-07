// La Forja entre etapas (como la tienda de Brotato): el mercader con cinco ofertas (armas, objetos con contrapartida,
// equipo, vendas), renovar y guardar ofertas; el yunque que sube armas con hierro negro; el altar de sangre que
// pone sobrecargas antes de tiempo; y vender objetos. Al terminar, «Bajar» a la etapa siguiente.
import { NIVEL_MAX_ARMA } from '../datos/armas';
import { OBJETO } from '../datos/botin';
import type { Expedicion, OfertaForja } from '../expedicion';
import { escoger } from '../sim/opciones';
import type { Jugador } from '../sim/jugador';
import type { Sim } from '../sim/sim';
import { DESCANSO, ETAPAS } from '../datos/mundo';
import { RAREZA_COLOR, glifo, icono } from './iconos';
import type { VistaEleccion } from './eleccion';
import { aviso } from './hud';
import { efectos } from '../sonidos';
import { brillar, sinSaltar } from './repintar';

export interface OpcionesForja {
  exp: Expedicion;
  j: Jugador;
  sim: Sim;
  eleccion: VistaEleccion;
  alListo: () => void;
  /** En grupo: texto de a quién se espera (o null si nadie). */
  esperando?: () => string | null;
  /** Pista del tutorial arriba. */
  pista?: string;
  /** Texto del botón para seguir (por defecto «Bajar a la etapa N»). */
  textoListo?: string;
}

const $p = () => document.getElementById('pantallas')!;

const NOMBRE_TIPO: Record<OfertaForja['tipo'], string> = { arma: 'Arma', objeto: 'Objeto', equipo: 'Equipo', curar: 'Vendas' };

export function mostrarForja(o: OpcionesForja) {
  const { exp, j } = o;
  const raiz = document.createElement('section');
  raiz.className = 'pantalla opaca pantalla-forja';
  $p().replaceChildren(raiz);
  let listo = false;

  // (al comprar o mejorar, la lista se queda donde estabas)
  const pintar = () => sinSaltar(raiz, dibujar);
  const dibujar = () => {
    const f = exp.forja.get(j.i);
    if (!f) return;
    const b = exp.bolsa(j);
    const ofertas = f.ofertas.map((of) => {
      const caro = of.precio > b.oro;
      return `<button class="oferta pergamino${of.vendida ? ' vendida' : ''}${caro ? ' caro' : ''}${of.guardada ? ' guardada' : ''}" data-o="${of.id}" style="--rareza:${RAREZA_COLOR[of.rareza] ?? RAREZA_COLOR[0]}" ${of.vendida ? 'disabled' : ''}>
        <span class="guardar" data-g="${of.id}" title="Guardar para la próxima">${glifo('candado')}</span>
        <span class="ico">${icono(of.glifo, of.tipo === 'arma' ? of.ref : undefined)}</span>
        <em class="tipo-oferta">${NOMBRE_TIPO[of.tipo]}</em>
        <b>${of.nombre}</b><small>${of.desc}</small>
        <span class="precio">${of.vendida ? 'Vendida' : `<span class="ico">${glifo('oro')}</span>${of.precio}`}</span>
      </button>`;
    }).join('');
    const armas = j.armas.map((a, k) => {
      const pY = exp.precioYunque(j, k);
      const max = a.nivel >= NIVEL_MAX_ARMA;
      const restantes = a.def.sobrecargas.filter((s) => !a.sobrecargas.includes(s.id)).length;
      const pS = exp.precioSangre(j, k);
      const usada = f.sangreUsada[k];
      return `<div class="arma-forja">
        <span class="ico">${icono(a.def.glifo, a.def.id)}</span>
        <span class="nombre-arma"><b>${a.def.nombre}</b><small>Nivel ${a.nivel}${a.sobrecargas.length ? ` · ${a.sobrecargas.length} sobrecarga${a.sobrecargas.length > 1 ? 's' : ''}` : ''}</small></span>
        <button class="boton boton-chico" data-y="${k}" ${max || b.hierro < pY ? 'disabled' : ''}>${max ? 'Al máximo' : `+1 nivel · <span class="ico">${glifo('hierro')}</span>${pY}`}</button>
        <button class="boton boton-chico boton-sangre" data-s="${k}" ${!restantes || usada || b.sangre < pS ? 'disabled' : ''}>${!restantes ? 'Sin sobrecargas' : usada ? 'Ya bendecida' : `Sobrecarga · <span class="ico">${glifo('gota')}</span>${pS}`}</button>
      </div>`;
    }).join('');
    const objetos = j.objetos.length
      ? j.objetos.map((id) => {
          const ob = OBJETO[id];
          return ob ? `<button class="objeto-mini" data-v="${id}" title="${ob.desc}"><span class="ico">${glifo(ob.glifo)}</span><span>${ob.nombre}</span><small>Vender · ${Math.round(ob.precio * 0.5)}</small></button>` : '';
        }).join('')
      : '<small class="vacio">Todavía no llevas objetos.</small>';
    const espera = listo ? o.esperando?.() ?? null : null;
    raiz.innerHTML = `
      <header class="cabeza">
        <h2>La Forja · antes de la etapa ${exp.etapa + 1}${exp.cfg.infinito ? (exp.esFinal(exp.etapa + 1) ? ' · jefe' : '') : ` de ${ETAPAS}`}</h2>
        <div class="saldo"><span class="r-oro"><span class="ico">${glifo('oro')}</span>${b.oro}</span><span class="r-hierro"><span class="ico">${glifo('hierro')}</span>${b.hierro}</span><span class="r-sangre"><span class="ico">${glifo('gota')}</span>${b.sangre}</span></div>
      </header>
      ${o.pista ? `<p class="pista-forja">${o.pista}</p>` : ''}
      <div class="forja">
        <div class="forja-columna placa mercader">
          <h3>El mercader <small>· toca para comprar; el candado la guarda</small></h3>
          <div class="ofertas">${ofertas}</div>
          <div class="fila-botones"><span class="vida-forja">Vida ${Math.ceil(j.hp)}/${Math.ceil(j.hpMax)}${j.hp < j.hpMax ? ` <small>· al bajar descansas: +${Math.round(DESCANSO * 100)} %</small>` : ''}</span><button class="boton" data-a="renovar" ${b.oro < exp.precioRenovar(j) ? 'disabled' : ''}>${glifo('dado')}Renovar · ${exp.precioRenovar(j)}</button></div>
        </div>
        <div class="forja-columna placa yunque-col">
          <h3>Yunque y altar de sangre</h3>
          <div class="armas-forja">${armas}</div>
          <h3>Tus objetos</h3>
          <div class="objetos-forja">${objetos}</div>
        </div>
      </div>
      <footer class="fila-botones">
        ${espera ? `<span class="espera">${espera}</span>` : ''}
        <button class="boton boton-sangre boton-grande" data-a="listo" ${listo ? 'disabled' : ''}>${listo ? 'Esperando…' : o.textoListo ?? `Bajar a la etapa ${exp.etapa + 1}`}</button>
      </footer>`;
  };

  /** Después de una compra o mejora: avisa si no se pudo; si sí, lo mejorado late con el aura dorada. */
  const tras = (err: string | null, bien: () => void, mejorado?: string) => {
    if (err) aviso(err, 'peligro', 1800);
    else bien();
    pintar();
    if (!err && mejorado) brillar(raiz.querySelector(mejorado));
    revisarCola();
  };

  // Las sobrecargas del altar (o las que quedaron pendientes) se escogen aquí mismo
  const revisarCola = () => {
    const e = j.cola[0];
    if (!e) {
      o.eleccion.cerrar();
      return;
    }
    o.eleccion.mostrar(e, {
      tiradas: 0, vetos: 0, tiempo: null,
      alEscoger: (k) => {
        escoger(o.sim, j, k);
        efectos.sobrecarga();
        pintar();
        revisarCola();
      },
      alTirar: () => undefined,
      alVetar: () => undefined,
    });
  };

  raiz.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const g = t.closest<HTMLElement>('[data-g]');
    if (g) {
      ev.stopPropagation();
      exp.guardar(j, g.dataset.g!);
      efectos.boton();
      pintar();
      return;
    }
    const of = t.closest<HTMLElement>('[data-o]');
    if (of) return tras(exp.comprar(j, of.dataset.o!), () => efectos.compra());
    const y = t.closest<HTMLElement>('[data-y]');
    if (y) return tras(exp.yunque(j, Number(y.dataset.y)), () => efectos.yunque(), `.arma-forja:nth-child(${Number(y.dataset.y) + 1})`);
    const s = t.closest<HTMLElement>('[data-s]');
    if (s) return tras(exp.altarSangre(j, Number(s.dataset.s)), () => efectos.sobrecarga(), `.arma-forja:nth-child(${Number(s.dataset.s) + 1})`);
    const v = t.closest<HTMLElement>('[data-v]');
    if (v) return tras(exp.vender(j, v.dataset.v!), () => efectos.compra());
    const a = t.closest<HTMLElement>('[data-a]')?.dataset.a;
    if (a === 'renovar') return tras(exp.renovar(j), () => efectos.carta());
    if (a === 'listo') {
      if (j.cola.length) return revisarCola();
      listo = true;
      efectos.boton();
      pintar();
      o.alListo();
    }
  });
  pintar();
  revisarCola();
  return {
    refrescar: pintar,
    cerrar() {
      o.eleccion.cerrar();
      raiz.remove();
    },
  };
}


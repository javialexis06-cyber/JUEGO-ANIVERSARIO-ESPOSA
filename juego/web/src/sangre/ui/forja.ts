// La Forja entre etapas, con tres mostradores como la tienda de Deep Rock: el armero (entrenar armas con hierro negro,
// armas nuevas, el yunque y el altar de sangre), etiquetas y objetos (mejoras de etiqueta y objetos con contrapartida,
// vender objetos) y el personaje (mejoras de estadística, equipo y curar, que sube de precio). Las mejoras traen rareza
// y cuestan según ella; renovar cambia los tres y el candado guarda una oferta. Al terminar, «Bajar».
import { NIVEL_MAX_ARMA } from '../datos/armas';
import { OBJETO } from '../datos/botin';
import type { Expedicion, OfertaForja } from '../expedicion';
import { escoger } from '../sim/opciones';
import type { Jugador } from '../sim/jugador';
import type { Sim } from '../sim/sim';
import { DESCANSO } from '../datos/mundo';
import { NOMBRE_RAREZA } from '../tipos';
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

const NOMBRE_TIPO: Record<OfertaForja['tipo'], string> = { arma: 'Arma nueva', objeto: 'Objeto', equipo: 'Equipo', curar: 'Vendas', mejora: 'Mejora' };

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
    const oferta = (of: OfertaForja) => {
      const hierro = of.pago === 'hierro';
      const caro = of.precio > (hierro ? b.hierro : b.oro);
      const tipo = of.tipo === 'mejora' ? `${NOMBRE_RAREZA[of.rareza]}${of.op?.tipo === 'arma' ? ' · entrenar' : ''}` : NOMBRE_TIPO[of.tipo];
      return `<button class="oferta-fila pergamino${of.vendida ? ' vendida' : ''}${caro ? ' caro' : ''}${of.guardada ? ' guardada' : ''}" data-o="${of.id}" style="--rareza:${RAREZA_COLOR[of.rareza] ?? RAREZA_COLOR[0]}" ${of.vendida ? 'disabled' : ''}>
        <span class="ico">${icono(of.glifo, of.tipo === 'arma' || of.op?.tipo === 'arma' ? of.op?.id ?? of.ref : undefined)}</span>
        <span class="texto-oferta"><em class="tipo-oferta">${tipo}</em><b>${of.nombre}</b><small>${of.desc}</small></span>
        <span class="precio">${of.vendida ? 'Listo' : `<span class="ico">${glifo(hierro ? 'hierro' : 'oro')}</span>${of.precio}`}</span>
        <span class="guardar" data-g="${of.id}" title="Guardar para la próxima">${glifo('candado')}</span>
      </button>`;
    };
    const de = (m: string) => f.ofertas.filter((of) => (of.mostrador ?? 'personaje') === m).map(oferta).join('') || '<small class="vacio">Nada por ahora.</small>';
    const armas = j.armas.map((a, k) => {
      const pY = exp.precioYunque(j, k);
      const max = a.nivel >= NIVEL_MAX_ARMA;
      const restantes = a.def.sobrecargas.filter((s) => !a.sobrecargas.includes(s.id)).length;
      const pS = exp.precioSangre(j, k);
      const usada = f.sangreUsada[k];
      return `<div class="arma-forja">
        <span class="ico">${icono(a.def.glifo, a.def.id)}</span>
        <span class="nombre-arma"><b>${a.def.nombre}</b><small>Nivel ${a.nivel}${a.sobrecargas.length ? ` · ${a.sobrecargas.length} sobrecarga${a.sobrecargas.length > 1 ? 's' : ''}` : ''}</small></span>
        <button class="boton boton-chico" data-y="${k}" ${max || b.hierro < pY ? 'disabled' : ''}>${max ? 'Al máximo' : `+1 · <span class="ico">${glifo('hierro')}</span>${pY}`}</button>
        <button class="boton boton-chico boton-sangre" data-s="${k}" ${!restantes || usada || b.sangre < pS ? 'disabled' : ''}>${!restantes ? 'Sin sobrecargas' : usada ? 'Ya bendecida' : `Sobrecarga · <span class="ico">${glifo('gota')}</span>${pS}`}</button>
      </div>`;
    }).join('');
    const objetos = j.objetos.length
      ? j.objetos.map((id) => {
          const ob = OBJETO[id];
          return ob ? `<button class="objeto-mini" data-v="${id}" title="${ob.desc}"><span class="ico">${glifo(ob.glifo)}</span><span>${ob.nombre}</span><small>Vender · ${Math.round(ob.precio * 0.5)}</small></button>` : '';
        }).join('')
      : '<small class="vacio">Todavía no llevas objetos.</small>';
    const pC = exp.precioCurar(j);
    const llena = j.hp >= j.hpMax;
    const espera = listo ? o.esperando?.() ?? null : null;
    raiz.innerHTML = `
      <header class="cabeza">
        <h2>La Forja · antes de la etapa ${exp.etapa + 1}${exp.cfg.infinito ? (exp.esFinal(exp.etapa + 1) ? ' · jefe' : '') : ` de ${exp.total}${exp.esFinal(exp.etapa + 1) ? ' · jefe' : ''}`}</h2>
        <div class="saldo"><span class="r-oro"><span class="ico">${glifo('oro')}</span>${b.oro}</span><span class="r-hierro"><span class="ico">${glifo('hierro')}</span>${b.hierro}</span><span class="r-sangre"><span class="ico">${glifo('gota')}</span>${b.sangre}</span></div>
      </header>
      ${o.pista ? `<p class="pista-forja">${o.pista}</p>` : ''}
      <div class="forja forja-tres">
        <div class="forja-columna placa mostrador">
          <h3><span class="ico">${glifo('yunque')}</span>El armero <small>· hierro negro</small></h3>
          <div class="ofertas-col">${de('armero')}</div>
          <h4>Yunque y altar de sangre</h4>
          <div class="armas-forja">${armas}</div>
        </div>
        <div class="forja-columna placa mostrador">
          <h3><span class="ico">${glifo('pergamino')}</span>Etiquetas y objetos <small>· oro</small></h3>
          <div class="ofertas-col">${de('etiquetas')}</div>
          <h4>Tus objetos</h4>
          <div class="objetos-forja">${objetos}</div>
        </div>
        <div class="forja-columna placa mostrador">
          <h3><span class="ico">${glifo('corazon')}</span>El personaje <small>· oro</small></h3>
          <div class="ofertas-col">${de('personaje')}</div>
          <button class="oferta-fila pergamino curar${llena || b.oro < pC ? ' caro' : ''}" data-a="curar" style="--rareza:${RAREZA_COLOR[0]}" ${llena ? 'disabled' : ''}>
            <span class="ico">${glifo('corazon')}</span>
            <span class="texto-oferta"><em class="tipo-oferta">Vendas y aguardiente</em><b>Curar la mitad</b><small>Vida ${Math.ceil(j.hp)}/${Math.ceil(j.hpMax)}${llena ? '' : ` · al bajar descansas +${Math.round(DESCANSO * 100)} %`}. Cada vez cuesta más.</small></span>
            <span class="precio">${llena ? 'Llena' : `<span class="ico">${glifo('oro')}</span>${pC}`}</span>
          </button>
        </div>
      </div>
      <footer class="fila-botones">
        ${espera ? `<span class="espera">${espera}</span>` : '<small class="nota-forja">El candado guarda una oferta para la próxima Forja.</small>'}
        <button class="boton" data-a="renovar" ${b.oro < exp.precioRenovar(j) ? 'disabled' : ''}>${glifo('dado')}Renovar todo · ${exp.precioRenovar(j)}</button>
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
    if (a === 'curar') return tras(exp.curarForja(j), () => efectos.compra());
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


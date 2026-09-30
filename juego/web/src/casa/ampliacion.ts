// Ampliar la casa: el plano con los cuartos construidos y por construir, los trofeos de los minijuegos, la pintura
// del cuarto propio y el pedido a la cigüeña. Aquí solo se arma lo que se ve; las acciones las hace main.ts.
import { Casa, Cuarto, DUENO, NOMBRE_CUARTO, PRECIO_CUARTO, Rol, tieneCuarto } from './modelo';
import { METAL, nivel, nivelAmor, TROFEOS, valor, valorDe } from './trofeos';
import { caraClase, esc, nombre } from './ui_casa';

/** El plano: la casa vista desde arriba, tres pisos de a tres cuartos. */
const PLANO: Cuarto[][] = [
  ['cuarto_el', 'cuarto', 'cuarto_ella'],
  ['bano', 'sala', 'cocina'],
  ['juegos', 'trofeos', 'cuna'],
  // Afuera, a lo ancho: el patio del perrito
  ['patio'],
];
export const EMOJI: Record<Cuarto, string> = {
  sala: '🛋️', cocina: '🍳', bano: '🛁', cuarto: '🛏️', juegos: '🕹️', trofeos: '🏆', cuna: '🍼', cuarto_el: '💙', cuarto_ella: '💗', patio: '🐶',
};
/** Nombre corto para las pestañas de abajo. */
export const CORTO: Partial<Record<Cuarto, string>> = { cuarto_el: 'De Él', cuarto_ella: 'De Ella' };
const PARA_QUE: Partial<Record<Cuarto, string>> = {
  trofeos: 'Pedestales con los trofeos que ganen en los minijuegos.',
  cuna: 'Una cuna con móvil de estrellas… y la cigüeña trae a la bebé.',
  cuarto_el: 'Solo de Él: computador, sillón y paredes del color que quiera.',
  cuarto_ella: 'Solo de Ella: tocador con espejo de luces, escritorio y sillón.',
};

export function htmlPlano(c: Casa, vista: Cuarto, donde: Record<Rol, Cuarto>) {
  const celda = (k: Cuarto) => {
    const quien = (['el', 'ella'] as Rol[]).filter((r) => donde[r] === k);
    const caras = quien.length ? `<span class="quien">${quien.map((r) => `<span class="${caraClase(r)}"></span>`).join('')}</span>` : '';
    if (tieneCuarto(c, k)) {
      return `<button class="plano-cuarto plano-${k}" data-ir-cuarto="${k}" aria-current="${k === vista}">
        <span class="plano-emoji">${EMOJI[k]}</span><b>${NOMBRE_CUARTO[k]}</b>${caras}</button>`;
    }
    const precio = PRECIO_CUARTO[k] ?? 0;
    return `<div class="plano-cuarto por-construir">
        <span class="plano-emoji">${EMOJI[k]}</span><b>${NOMBRE_CUARTO[k]}</b><small>${PARA_QUE[k] ?? ''}</small>
        <button class="boton boton-chico boton-tomate" data-construir="${k}"${c.monedas < precio ? ' aria-disabled="true"' : ''}>Construir · <i class="moneda" aria-hidden="true"></i>${precio}</button>
      </div>`;
  };
  return `<div class="plano">
      <div class="plano-techo" aria-hidden="true"></div>
      <div class="plano-pisos">${PLANO.map((fila) => `<div class="plano-fila">${fila.map(celda).join('')}</div>`).join('')}</div>
    </div>
    <p class="nota-hoja">Toquen un cuarto para ir. Los que faltan se construyen con las monedas de los dos (se ganan jugando en el cuarto de juegos).</p>`;
}

export function htmlTrofeos(c: Casa) {
  const fila = (titulo: string, nv: number, detalle: string, barra: number, sub: string) => `
    <li class="trofeo metal-${nv}">
      <span class="trofeo-copa" aria-hidden="true">🏆</span>
      <div>
        <h3>${titulo} <em>${METAL[nv]}</em></h3>
        <p>${detalle}</p>
        <div class="trofeo-barra"><i style="width:${Math.round(Math.min(1, barra) * 100)}%"></i></div>
        <small>${sub}</small>
      </div>
    </li>`;
  const lista = TROFEOS.map((t) => {
    const nv = nivel(c, t.id);
    const v = valor(c, t.id);
    const meta: number | undefined = (t.metas as number[])[nv];
    const antes = nv ? t.metas[nv - 1] : 0;
    const cada = `${nombre('el')}: ${valorDe(c, t.id, 'el')} · ${nombre('ella')}: ${valorDe(c, t.id, 'ella')}`;
    return fila(
      t.nombre,
      nv,
      meta !== undefined ? `${v} de ${meta} ${t.unidad} para ${METAL[nv + 1].toLowerCase()}` : `¡Oro! ${v} ${t.unidad}`,
      meta !== undefined ? (v - antes) / (meta - antes) : 1,
      `Cuenta lo mejor de los dos. ${cada}`,
    );
  }).join('');
  const amor = nivelAmor(c);
  const copa = fila(
    'Copa del amor',
    amor,
    amor === 3 ? '¡De oro! Los mejores en todo.' : 'Es del metal del trofeo más bajito: brillen en todos los juegos.',
    TROFEOS.reduce((a, t) => a + nivel(c, t.id), 0) / 12,
    'La del podio del centro.',
  );
  const sala = tieneCuarto(c, 'trofeos')
    ? '<button class="boton boton-menta" data-ir-cuarto="trofeos">Ir a la sala de trofeos</button>'
    : `<p class="nota-hoja">Construyan la sala de trofeos para verlos brillar en sus pedestales.</p>
       <button class="boton boton-tomate" data-construir="trofeos">Construir la sala · <i class="moneda" aria-hidden="true"></i>${PRECIO_CUARTO.trofeos}</button>`;
  return `<ul class="trofeos-lista">${lista}${copa}</ul><div class="fila-botones">${sala}</div>`;
}

/** Colores para las paredes del cuarto propio. */
export const COLORES_PARED = [
  '#F8DCE6', '#F7C6D3', '#F2A5B8', '#FBE3C4', '#FFF1D2', '#FCE7A8', '#DDEFD9', '#BFE3D8', '#D3E5F2', '#BFD9F2', '#DCD6F7', '#C9B6EA', '#F2D1B8',
  '#FFFFFF', '#E9E1D8',
  // Los de los conceptos de decoración (gamer, griego, egipcio…)
  '#3A3F5C', '#EAF2F8', '#F2D9A6', '#34406B', '#BFE9E4', '#F6E7DA', '#F9D5E5', '#4A4A5E', '#F8E27A', '#F5E6CA', '#C8D8E4', '#DCE8D2', '#FBE3F0',
  '#EDE3D1', '#E9F2EC', '#4E3D63', '#5A2E3A', '#46306E', '#F7D6D6', '#EFEFEA',
];

export function htmlPintar(c: Casa, k: Cuarto) {
  const actual = c.pintura?.[k] ?? '';
  return `<p class="nota-hoja">Elige el color de las paredes de tu cuarto. Solo ${nombre(DUENO[k] ?? 'el')} lo puede cambiar.</p>
    <div class="paleta-pared">${COLORES_PARED.map(
      (col) => `<button class="muestra-pared" data-pintar="${col}" style="background:${col}" aria-pressed="${col.toLowerCase() === actual.toLowerCase()}" aria-label="Color ${col}"></button>`,
    ).join('')}</div>
    <div class="fila-botones"><button class="boton boton-papel boton-chico" data-pintar="">Como venía</button></div>`;
}

export function htmlBebe(c: Casa) {
  if (c.bebe) {
    const dias = Math.max(0, Math.floor((Date.now() - c.bebe.desde) / 86400000));
    return `<p class="nota-hoja"><b>${esc(c.bebe.nombre)}</b> llegó ${dias === 0 ? 'hoy' : dias === 1 ? 'ayer' : `hace ${dias} días`}. Arrúllenla en la cuna o siéntense en la mecedora.</p>
      <div class="fila-botones"><button class="boton boton-rosa" data-accion-hoja="arrullar">Arrullarla</button></div>`;
  }
  return `<p class="nota-hoja">¿Le piden un bebé a la cigüeña? Entra volando por la ventana con la bebé en un pañuelo y la deja en la cuna.</p>
    <form id="form-bebe" class="form-bebe">
      <p class="nota-hoja"><b>¿Cómo se va a llamar?</b></p>
      <div class="nombres-bebe">
        <label><input type="radio" name="bebe-nombre" value="Katherine" checked><span>Katherine<small>como dice Él</small></span></label>
        <label><input type="radio" name="bebe-nombre" value="Lexy Katherine"><span>Lexy Katherine<small>como dice Ella</small></span></label>
      </div>
      <label class="campo">O escriban otro nombre<input id="bebe-otro" maxlength="30" placeholder="Opcional"></label>
      <button class="boton boton-rosa" type="submit">Pedírsela a la cigüeña</button>
    </form>`;
}

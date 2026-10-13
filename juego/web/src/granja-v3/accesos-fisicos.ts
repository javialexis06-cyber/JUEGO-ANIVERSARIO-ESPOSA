import type { Accion, Edificio, EstadoGranja } from './estado';
import { ARTICULOS } from './catalogo';
import { EDIFICIOS_PUEBLO, viviendaInterior, VIVIENDAS_PUEBLO } from './pueblo-datos';
import { dormitorioDef, puertaDormitorio } from './dormitorios';
import { regionAstra } from './astra';

export interface AccesoFisico {
  id: string;
  /** Centro del umbral transitable y normal hacia el lado de aproximación. */
  x: number; z: number; nx: number; nz: number;
  puerta: { x: number; z: number };
  aproximacion: { x: number; z: number };
  destino: 'hogar' | 'edificio' | 'servicio' | 'vivienda' | 'dormitorio' | 'astra' | 'salida' | 'salida_astra' | 'salida_colonia';
  referencia?: string;
}

export function puertaEdificio(b: Edificio) {
  const a = ARTICULOS.find(a => a.id === b.articulo)!;
  const c = a.corral ?? 0;
  return b.giro === 0 ? { x: b.x + a.ancho / 2, z: b.z + a.fondo + .5 } : b.giro === 1 ? { x: b.x + c - .5, z: b.z + a.ancho / 2 } : b.giro === 2 ? { x: b.x + a.ancho / 2, z: b.z + c - .5 } : { x: b.x + a.fondo + .5, z: b.z + a.ancho / 2 };
}

export function claveAccesos(s: EstadoGranja) { return [s.inicioTiempo, s.zona, s.interior, s.servicio, s.astra?.actual, s.astra?.interior, s.aventura.destinoActual].join(':'); }

/** Puertas reales, con las huellas y permisos anteriores. No incluye portones de ganado ni teletransportes. */
export function accesosFisicos(s: EstadoGranja): AccesoFisico[] {
  if (s.aventura.destinoActual) return [];
  const salida = (z: number, destino: AccesoFisico['destino']): AccesoFisico => ({ id: 'salida', x: 0, z, nx: 0, nz: -1, puerta: { x: 0, z: z + .3 }, aproximacion: { x: 0, z: z - .5 }, destino });
  if (s.astra?.actual) {
    if (s.astra.interior) return [salida(4.25, s.astra.interior.startsWith('habitat_') ? 'salida_colonia' : 'salida_astra')];
    return (regionAstra(s.astra.actual)?.viviendas ?? []).map(h => ({ id: 'astra:' + h.id, x: h.entrada.x, z: h.z + h.fondo + .35, nx: 0, nz: 1, puerta: { x: h.entrada.x, z: h.z + h.fondo }, aproximacion: h.entrada, destino: 'astra', referencia: h.id }));
  }
  if (s.servicio) {
    const local = EDIFICIOS_PUEBLO.find(b => b.servicio === s.servicio), vivienda = VIVIENDAS_PUEBLO.find(v => v.edificio === local?.id);
    return [salida(3.45, 'salida'), ...(vivienda ? [{ id: 'anexo:' + vivienda.id, x: 3.2, z: -2.45, nx: 0, nz: 1, puerta: { x: 3.2, z: -3.9 }, aproximacion: { x: 3.2, z: -2 }, destino: 'vivienda' as const, referencia: vivienda.id }] : [])];
  }
  if (s.interior) {
    const d = dormitorioDef(s.interior), v = viviendaInterior(s.interior);
    const out = [salida(d ? 3.25 : v ? 4.25 : s.invernaderos.some(i => i.edificioId === s.interior) ? 5.5 : 3.45, 'salida')];
    if (v && !d) for (const id of v.ocupantes) { const p = puertaDormitorio(id)!; out.push({ id: 'dormitorio:' + id, x: p.x, z: -4.05, nx: 0, nz: 1, puerta: { x: p.x, z: -4.9 }, aproximacion: p, destino: 'dormitorio', referencia: id }); }
    return out;
  }
  if (s.zona === 'pueblo') return [
    ...EDIFICIOS_PUEBLO.map(b => ({ id: 'servicio:' + b.servicio, x: b.entrada.x, z: b.z + b.fondo + .35, nx: 0, nz: 1, puerta: { x: b.entrada.x, z: b.z + b.fondo }, aproximacion: b.entrada, destino: 'servicio' as const, referencia: b.servicio })),
    ...VIVIENDAS_PUEBLO.filter(v => !v.edificio).map(v => ({ id: 'vivienda:' + v.id, x: v.entrada.x, z: v.z + v.fondo + .35, nx: 0, nz: 1, puerta: { x: v.entrada.x, z: v.z + v.fondo }, aproximacion: v.entrada, destino: 'vivienda' as const, referencia: v.id })),
  ];
  if (s.zona !== 'granja') return [];
  return s.edificios.flatMap(b => {
    const a = ARTICULOS.find(a => a.id === b.articulo);
    if (!a || !['casa', 'refugio'].includes(a.categoria) && b.articulo !== 'establo' && b.articulo !== 'invernadero') return [];
    const p = puertaEdificio(b), nx = [0, -1, 0, 1][b.giro], nz = [1, 0, -1, 0][b.giro];
    return [{ id: 'edificio:' + b.id, x: p.x - nx * .15, z: p.z - nz * .15, nx, nz, puerta: { x: p.x - nx * .5, z: p.z - nz * .5 }, aproximacion: p, destino: b.articulo === 'casa' ? 'hogar' as const : 'edificio' as const, referencia: b.id }];
  });
}

export function accionAcceso(s: EstadoGranja, a: AccesoFisico, xJugador: number, zJugador: number): Accion | null {
  const p = { xJugador, zJugador };
  switch (a.destino) {
    case 'hogar': return null;
    case 'edificio': return { tipo: 'entrar', edificioId: a.referencia!, ...p };
    case 'servicio': return { tipo: 'entrar_servicio', servicio: a.referencia! as NonNullable<EstadoGranja['servicio']>, ...p };
    case 'vivienda': return { tipo: 'entrar_vivienda', id: a.referencia!, ...p };
    case 'dormitorio': return { tipo: 'entrar_dormitorio', npcId: a.referencia!, ...p };
    case 'astra': return { tipo: 'astra', accion: { tipo: 'vivienda', id: a.referencia! }, ...p };
    case 'salida_astra': return { tipo: 'astra', accion: { tipo: 'salir_vivienda' }, ...p };
    case 'salida_colonia': return { tipo: 'regional', accion: { tipo: 'salir_habitat' }, ...p };
    case 'salida': return s.servicio ? { tipo: 'salir_servicio' } : { tipo: 'salir' };
  }
}

/** Cruce dirigido y estrecho: caminar junto a la pared o aparecer en el umbral no activa la puerta. */
export function cruzaUmbral(a: AccesoFisico, antes: { x: number; z: number }, ahora: { x: number; z: number }) {
  if (!Number.isFinite(antes.x + antes.z + ahora.x + ahora.z) || Math.hypot(ahora.x - antes.x, ahora.z - antes.z) > 2) return false;
  const d0 = (antes.x - a.x) * a.nx + (antes.z - a.z) * a.nz, d1 = (ahora.x - a.x) * a.nx + (ahora.z - a.z) * a.nz;
  if (d0 <= 0 || d1 > 0 || d0 === d1) return false;
  const t = d0 / (d0 - d1), x = antes.x + (ahora.x - antes.x) * t, z = antes.z + (ahora.z - antes.z) * t;
  return Math.abs((x - a.x) * -a.nz + (z - a.z) * a.nx) < .7;
}

export const frenteMostrador = (x: number, z: number) => Number.isFinite(x + z) && Math.abs(x) < 2.4 && z >= -1.25 && z <= .25;

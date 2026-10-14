// Bajas por minuto en Lavado y tiempo de control de la horda en Sangre y Ceniza.
// Solo pilotos, cartas ofrecidas y compras pagadas. Los perfiles de tienda/arsenal completos se marcan preparados.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Motor, TARDE_VIDA } from '../src/casa/lavado/motor';
import { Azar } from '../src/casa/lavado/azar';
import { botPaso as botLavado, inventario, valorOpcion } from '../src/casa/lavado/bot';
import { PODERES, PODER, precioPoder } from '../src/casa/lavado/tienda';
import { ENEMIGOS } from '../src/casa/lavado/enemigos';
import { ESCENARIOS } from '../src/casa/lavado/escenarios';
import { ARMAS, PASIVAS, ESCONDIDAS, maxNivelArma } from '../src/casa/lavado/armas';
import type { IdEscenario, IdArma, Stat } from '../src/casa/lavado/tipos';
import { Expedicion } from '../src/sangre/expedicion';
import { botEscoger, botPaso as botSangre } from '../src/sangre/bot';
import { CLASES } from '../src/sangre/datos/clases';
import { ARMAS_COMUNES } from '../src/sangre/datos/armas';
import { progresoNuevo, perfilDe } from '../src/sangre/progreso';
import { TIPOS, esJefe } from '../src/sangre/sim/catalogo';
import { S } from '../src/sangre/sim/estado';
import type { IdClase, PerfilJugador } from '../src/sangre/tipos';

const juego = process.argv[2] ?? 'lavado', carpeta = process.argv[3] ?? 'test-results/auditoria-combate';
mkdirSync(carpeta, { recursive: true });
const DT = 1 / 30, semillas = (process.env.SEMILLAS ?? '1000,8919,16838').split(',').map(Number);
const red = (n: number) => Math.round(n * 100) / 100;
const percentil = (a: number[], k: number) => a.length ? a.sort((a, b) => a - b)[Math.min(a.length - 1, Math.floor(a.length * k))] : 0;
const informes: unknown[] = [];
// Algunas elecciones del piloto y fases de enemigos usan Math.random además del azar propio del motor.
const fijarAzarGlobal = (semilla: number) => { const az = new Azar(semilla ^ 0x5a17c9e3); Math.random = () => az.n(); };

if (juego === 'lavado') {
  const escenario = (process.env.ESCENARIO ?? 'cara') as IdEscenario;
  const disfraces = (process.env.DISFRACES ?? 'el_panda,ella_pulga').split(',');
  const tiendas: Record<string, Partial<Record<Stat, number>>> = {
    nada: {}, media: Object.fromEntries(PODERES.filter(p => p.precio <= 450 && p.id !== 'maldicion').map(p => [p.id, Math.ceil(p.max / 2)])),
    toda: Object.fromEntries(PODERES.filter(p => p.id !== 'maldicion').map(p => [p.id, p.max])),
  };
  const familias: Record<string, IdArma[]> = { normal: [], distancia: ['burbujas', 'bombillo', 'botellas', 'peinilla'], area: ['espuma', 'champu', 'jabon', 'ducha', 'esponjas'] };
  const jugar = (disfraz: string, tienda: string, familia: string, semilla: number, poderes: Partial<Record<Stat, number>>) => {
    fijarAzarGlobal(semilla);
    const m = new Motor({ escenario, apurado: false, semilla, jugadores: [{ rol: disfraz.startsWith('ella') ? 'ella' : 'el', disfraz, poderes: { ...poderes }, secretos: [] }] });
    const elegir = m.escoger.bind(m), favoritas = familias[familia];
    if (favoritas.length) m.escoger = (i, k, n) => {
      const j = m.jug[i];
      if (j.opciones) k = j.opciones.reduce((mejor, o, x, a) => {
        const valor = (o: typeof a[number]) => valorOpcion(j, o) + (o.tipo === 'arma' && favoritas.includes(o.id as IdArma) ? 12 : 0);
        return valor(o) > valor(a[mejor]) ? x : mejor;
      }, 0);
      elegir(i, k, n);
    };
    const ventanas: Record<number, { bajas: number; porTipo: Record<string, number>; danoReal: number; golpes: number; recibidos: number }> = {};
    const ventana = () => ventanas[Math.floor(m.t / 60)] ??= { bajas: 0, porTipo: {}, danoReal: 0, golpes: 0, recibidos: 0 };
    const herir = m.herir.bind(m), matar = m.matar.bind(m), herirJ = m.herirJugador.bind(m);
    m.herir = (e, ...a) => { const hp = e.hp; herir(e, ...a); const v = ventana(); v.golpes++; v.danoReal += Math.min(Math.max(0, hp), Math.max(0, hp - e.hp)); };
    m.matar = (e, ...a) => { if (e.vivo && !e.luz) { const v = ventana(); v.bajas++; v.porTipo[e.tipo] = (v.porTipo[e.tipo] ?? 0) + 1; } matar(e, ...a); };
    m.herirJugador = (j, ...a) => { const hp = j.vida; herirJ(j, ...a); ventana().recibidos += Math.max(0, hp - j.vida); };
    const muestras: unknown[] = []; let siguiente = 60, pasos = 0;
    while (!m.fin && m.t < 31 * 60 && pasos++ < 31 * 60 * 30 * 1.2) {
      botLavado(m); m.paso(DT);
      if (m.t >= siguiente) {
        const en = m.en.filter(e => e.vivo && !e.luz && !e.jefe && !e.elite), j = m.jug[0];
        muestras.push({ minuto: siguiente / 60, bajas: m.eliminados, nivel: m.nivel, vida: red(j.vida),
          comunes: en.length, hpMediana: red(percentil(en.map(e => e.hpMax), .5)), hpP90: red(percentil(en.map(e => e.hpMax), .9)),
          armas: j.armas.map(a => ({ id: a.id, nivel: a.nivel })), poder: red(j.st.poder), enfriamiento: red(j.st.enfriamiento) });
        siguiente += 60;
      }
    }
    assert.ok(m.fin || m.gano, `Debe llegar a derrota o victoria reglamentaria: t=${m.t}, nivel=${m.nivel}, pausa=${m.pausa}`);
    // El juego ya declara victoria a los 30:00. Si sobrevive a la Ducha, usa el retiro normal, sin cambiar gano.
    const retiroTrasVictoria = !m.fin;
    if (retiroTrasVictoria) m.terminar(true);
    assert.ok(Number.isFinite(m.jug[0].vida));
    const r = m.resumen(0), tarde = Object.entries(ventanas).filter(([n]) => +n >= 22 && +n < 30);
    const informe = { escenario, disfraz, tienda, familia, semilla, preparado: tienda !== 'nada' && !tienda.startsWith('pagada'),
      segundos: red(m.t), gano: r.gano, retiroTrasVictoria, oro: r.oro, bajas: m.eliminados, bajasDesde22: tarde.reduce((n, [, v]) => n + v.bajas, 0),
      inventario: inventario(m.jug[0]), cartas: [...m.jug[0].cartas], patitosGanados: { ...m.jug[0].patitosGanados }, ventanas, muestras, poderes: { ...poderes } };
    informes.push(informe);
    console.log(`${tienda} · ${disfraz} · ${familia} · semilla ${semilla}: ${red(m.t / 60)} min, ${r.gano ? 'victoria' : 'derrota'}, bajas 22–30=${informe.bajasDesde22}`);
    return r;
  };
  for (const tienda of (process.env.TIENDAS ?? 'nada,media,toda').split(',')) for (const disfraz of disfraces) {
    for (const semilla of semillas) jugar(disfraz, tienda, 'normal', semilla, tiendas[tienda]);
  }
  for (const familia of (process.env.FAMILIAS_ADICIONALES ?? 'distancia,area').split(',').filter(Boolean)) for (const disfraz of disfraces) {
    jugar(disfraz, 'toda', familia, semillas[0], tiendas.toda);
  }
  // Serie de partidas desde cero: paga cada mejora con el resultado anterior, sin entregar moneda ni poderes.
  const orden: Stat[] = ['poder', 'vida', 'recuperacion', 'armadura', 'area', 'enfriamiento', 'iman', 'crecimiento', 'movimiento', 'duracion', 'velocidad', 'codicia', 'suerte', 'cantidad', 'revivir', 'tirar'];
  for (const disfraz of disfraces) {
    const compras: Partial<Record<Stat, number>> = {}; let oro = 0;
    for (let k = 1; k <= Number(process.env.PARTIDAS_PAGADAS ?? 6); k++) {
      const r = jugar(disfraz, `pagada-${k}`, 'normal', 7919 + k * 104729, compras); oro += r.oro;
      for (let n = 0; n < 200; n++) {
        const id = orden.find(x => (compras[x] ?? 0) < PODER[x].max);
        if (!id) break; const precio = precioPoder(id, compras); if (precio > oro) break;
        oro -= precio; compras[id] = (compras[id] ?? 0) + 1;
      }
    }
  }
  const curva = [18, 20, 21, 22, 24, 26, 28, 29].map(minuto => {
    const ol = ESCENARIOS[escenario].oleadas[minuto];
    return { minuto, minimo: ol.min, tipos: ol.tipos.map(id => ({ id, vida: red(ENEMIGOS[id].vida * (1 + Math.max(0, minuto - 14) * TARDE_VIDA)) })) };
  });
  writeFileSync(join(carpeta, 'lavado.json'), JSON.stringify({ alcance: 'Motor sin dibujo, piloto y cartas legales; tienda media/toda son perfiles preparados; series pagadas parten de cero. No certifica destreza ni teléfonos.', curva, partidas: informes }, null, 2));
} else if (juego === 'receta-muerte') {
  // Recorrido de la receta con los datos aprobados; permite comparar revisiones anteriores sin duplicar hallazgos.
  const nuevas = [
    { id: 'aretIzq', escenario: 'cara', x: 1750, y: 1300 },
    { id: 'aretIzq', escenario: 'lavamanos', x: -3200, y: 120 },
    { id: 'aretDer', escenario: 'lavamanos', x: 3600, y: 120 },
    { id: 'aretDer', escenario: 'banera', x: 1500, y: -1500 },
    { id: 'aretIzq', escenario: 'ducha', x: -1800, y: -1400 },
    { id: 'aretDer', escenario: 'ducha', x: 1800, y: 1400 },
  ] as const;
  if (process.env.PROPUESTA_ARETES === '1') for (const t of nuevas) {
    if (!ESCONDIDAS.some(x => x.id === t.id && x.escenario === t.escenario)) ESCONDIDAS.push({ ...t, pista: 'propuesta de prueba' });
  }
  const poderes = Object.fromEntries(PODERES.filter(p => p.id !== 'maldicion').map(p => [p.id, p.max]));
  for (const escenario of (process.env.ESCENARIOS ?? 'cara,lavamanos,banera,ducha').split(',') as IdEscenario[]) for (const semilla of semillas) {
    fijarAzarGlobal(semilla);
    const m = new Motor({ escenario, apurado: false, semilla, jugadores: [{ rol: 'el', disfraz: 'el_panda', poderes, secretos: ['cortina', 'aretIzq', 'aretDer'] }] }), j = m.jug[0];
    const escoger = m.escoger.bind(m);
    m.escoger = (i, k, n) => {
      const a = m.jug[i].opciones;
      if (a) k = a.reduce((mejor, o, x) => {
        const faltanAretes = !j.pasivas.has('aretIzq') || !j.pasivas.has('aretDer');
        const valor = (o: typeof a[number]) => valorOpcion(j, o) + (o.tipo === 'arma' && o.id === 'cortina' ? 20 : 0)
          - (faltanAretes && o.tipo === 'pasiva' && o.nueva && j.pasivas.size >= 4 ? 100 : 0);
        return valor(o) > valor(a[mejor]) ? x : mejor;
      }, 0);
      escoger(i, k, n);
    };
    let muertes = 0, pasos = 0; const matar = m.matar.bind(m);
    const muertesDetalle: unknown[] = [];
    const danoMuerte: Record<string, { golpes: number; dano: number; maximo: number }> = {};
    const herirMuerte = m.herir.bind(m);
    m.herir = (e, ...a) => {
      if (e.tipo === 'duchaHelada') {
        const r = danoMuerte[a[6]] ??= { golpes: 0, dano: 0, maximo: 0 };
        r.golpes++; r.dano += a[0]; r.maximo = Math.max(r.maximo, a[0]);
      }
      herirMuerte(e, ...a);
    };
    m.matar = (e, ...a) => {
      if (e.vivo && e.tipo === 'duchaHelada') { muertes++; muertesDetalle.push({ t: m.t, hp: e.hp, hpMax: e.hpMax, uid: e.uid, fuente: new Error().stack }); }
      matar(e, ...a);
    };
    while (!m.fin && !muertes && m.t < 46 * 60 && pasos++ < 46 * 60 * 30 * 1.2) {
      botLavado(m);
      if (m.t >= Number(process.env.BUSCAR_DESDE ?? 3) * 60 && m.t < 28 * 60 && !m.pausa) {
        const tesoro = m.objs.filter(o => o.vivo && o.tipo === 'tesoro' && ESCONDIDAS[o.calidad]?.id.startsWith('aret'))
          .sort((a, b) => Math.hypot(a.x - j.x, a.y - j.y) - Math.hypot(b.x - j.x, b.y - j.y))[0];
        if (tesoro) { const dx = tesoro.x - j.x, dy = tesoro.y - j.y, d = Math.hypot(dx, dy) || 1; j.mx = dx / d; j.my = dy / d; }
      }
      if (m.helada && j.armas.some(a => a.id === 'cortinaTerciopelo')) j.mx = j.my = 0;
      m.paso(DT);
    }
    const r = { escenario, semilla, preparado: 'Disponibilidad de secretos y tienda completa; niveles, tesoros, cofres y evolución obtenidos en partida.',
      buscarDesde: Number(process.env.BUSCAR_DESDE ?? 3), propuestaAretes: process.env.PROPUESTA_ARETES === '1', segundos: red(m.t), gano: m.gano, fin: m.fin, muertesDerrotadas: muertes,
      evoluciones: m.evoluciones, inventario: inventario(j), vidaJugador: red(j.vida), muertesDetalle, danoMuerte };
    informes.push(r); console.log(`${escenario} · ${semilla}: ${red(m.t / 60)} min, ${muertes} muertes derrotadas, ${m.evoluciones.join(',')}`);
  }
  writeFileSync(join(carpeta, 'receta-muerte.json'), JSON.stringify({ alcance: 'Recorrido con tienda y secretos disponibles preparados; cartas, recogida y evolución legales. Usa los hallazgos del motor seleccionado; PROPUESTA_ARETES solo completa revisiones anteriores en el proceso de pruebas.', nuevas, partidas: informes }, null, 2));
} else if (juego === 'muerte') {
  // Combate diagnóstico preparado: no equivale a obtener estas evoluciones en una partida.
  const poderes = Object.fromEntries(PODERES.filter(p => p.id !== 'maldicion').map(p => [p.id, p.max]));
  const acceso = Object.values(ESCENARIOS).map(e => ({ escenario: e.id,
    aretes: ESCONDIDAS.filter(x => x.escenario === e.id && x.id.startsWith('aret')).map(x => x.id) }));
  for (const esc of ['cara', 'lavamanos', 'banera', 'ducha'] as IdEscenario[]) {
    fijarAzarGlobal(8919);
    const m = new Motor({ escenario: esc, apurado: false, semilla: 8919, jugadores: [{ rol: 'el', disfraz: 'el_panda', poderes, secretos: [] }] }), j = m.jug[0];
    j.armas.length = 0;
    for (const id of ['hiloSeda', 'cortinaTerciopelo', 'esponjasEternas', 'tormenta', 'toallazo', 'diluvio'] as IdArma[]) m.darArma(j, id, maxNivelArma(id));
    for (const id of ['jabonFuerte', 'relojArena', 'espejoDoble', 'crema', 'sales', 'gorro'] as const) j.pasivas.set(id, PASIVAS[id].max);
    m.recalcular(j); j.vida = j.vidaMax;
    Object.assign(m, { t: 1800, iEvento: m.esc.eventos.length });
    let muerte = 0, golpes = 0, primerHP = 0; const matar = m.matar.bind(m), herir = m.herirJugador.bind(m);
    m.matar = (e, ...a) => { if (e.vivo && e.tipo === 'duchaHelada') muerte++; matar(e, ...a); };
    m.herirJugador = (j, ...a) => { if (a[1]?.tipo === 'duchaHelada') golpes++; herir(j, ...a); };
    let pasos = 0;
    while (!m.fin && !muerte && m.t < 60 * 60 && pasos++ < 30 * 60 * 30) {
      botLavado(m); j.mx = j.my = 0; m.paso(DT);
      const primera = m.en.find(e => e.vivo && e.tipo === 'duchaHelada'); if (!primerHP && primera) primerHP = primera.hpMax;
    }
    const r = { escenario: esc, preparado: true, segundos: red(m.t), muertesDerrotadas: muerte, contactosMuerte: golpes,
      vidaInicialMuerte: red(primerHP), vidaJugador: red(j.vida), fin: m.fin,
      restantes: m.en.filter(e => e.vivo && e.tipo === 'duchaHelada').map(e => ({ hp: red(e.hp), hpMax: red(e.hpMax) })), inventario: inventario(j) };
    informes.push(r); console.log(`${esc}: ${muerte} muertes derrotadas, tiempo ${red(m.t / 60)}, vida ${red(j.vida)}`);
  }
  writeFileSync(join(carpeta, 'muerte.json'), JSON.stringify({ alcance: 'Combate preparado desde el minuto 30, seis evoluciones y tienda completa; prueba capacidad de daño y defensa, no adquisición legal.', accesoCortina: acceso, partidas: informes }, null, 2));
} else if (juego === 'sangre') {
  const clases = (process.env.CLASES ?? 'monarca,campesino,prisionero').split(',') as IdClase[];
  const perfiles = (process.env.PERFILES ?? 'inicio,arsenal').split(',');
  for (const modo of perfiles) for (const clase of clases) for (const semilla of semillas) {
    fijarAzarGlobal(semilla);
    const p = progresoNuevo();
    const perfil: PerfilJugador = modo === 'inicio'
      ? perfilDe(p, { id: 'piloto', nombre: 'Piloto', puesto: 0, clase, spec: 0, equipo: {}, cuerpo: 'el', tipo: 'amigo' }, CLASES[clase].arsenal, () => ({ meta: {}, tiradas: 0, vetos: 0 }))
      : { id: 'piloto', nombre: 'Piloto', puesto: 0, clase, spec: 0, meta: {}, equipo: {}, arsenal: [...CLASES[clase].arsenal], comunes: [...ARMAS_COMUNES], tiradas: 1, vetos: 1, cuerpo: 'el', tipo: 'amigo' };
    const infinito = process.env.INFINITO === '1';
    const exp = new Expedicion({ bioma: 'cementerio', peligro: Number(process.env.PELIGRO ?? 1), mutadores: [], semilla, infinito }, [perfil]);
    const etapas: unknown[] = [];
    while (exp.fase !== 'fin' && exp.etapa + (exp.fase === 'forja' ? 1 : 0) <= Number(process.env.HASTA_ETAPA ?? 20)) {
      const sim = exp.iniciarEtapa(), E = sim.E;
      // Medir el bloqueo que ve la IA, antes de los proyectiles/zonas del final del cuadro.
      const bloqueoIA = new Uint8Array(E.max), uidIA = new Uint16Array(E.max);
      const pasoEstado = (E as Partial<typeof E>).pasoAturdimiento?.bind(E);
      if (pasoEstado) E.pasoAturdimiento = (i, dt) => { pasoEstado(i, dt); bloqueoIA[i] = E.aturdido[i] > 0 ? 1 : 0; uidIA[i] = E.uid[i]; };
      const afk = { desde: 15, hasta: Number(process.env.AFK_HASTA ?? 75), segundos: 0, golpes: 0, dano: 0, vidaMinima: sim.J[0].hp, nivel: 0, armas: [] as string[] };
      let quieto = false;
      const porMin: Record<number, { intentosGolpe: number; golpesRecibidos: number; danoRecibido: number; muestrasCerca: number; aturdidas: number; retrocediendo: number }> = {};
      const ventana = () => porMin[Math.floor(sim.t / 60)] ??= { intentosGolpe: 0, golpesRecibidos: 0, danoRecibido: 0, muestrasCerca: 0, aturdidas: 0, retrocediendo: 0 };
      const uid = new Uint16Array(E.max), racha = new Float32Array(E.max), vistas = new Float32Array(E.max), bloqueadas = new Float32Array(E.max);
      const tocados = new Uint16Array(E.max);
      let maxRacha = 0, maxId = '', golpesAturden = 0, pasos = 0, largos = 0, muyBloqueados = 0;
      const danar = sim.danar.bind(sim), herir = sim.herir.bind(sim);
      sim.danar = (i, base, g) => {
        const antes = E.uid[i], aturde = g.aturde > 0;
        const d = danar(i, base, g);
        if (d > 0) { tocados[i] = antes; if (aturde) golpesAturden++; }
        return d;
      };
      sim.herir = (j, ...a) => { const v = ventana(); v.intentosGolpe++; const r = herir(j, ...a); if (r > 0) { v.golpesRecibidos++; v.danoRecibido += r; if (quieto) { afk.golpes++; afk.dano += r; } } return r; };
      const cerrar = (i: number) => { if (vistas[i] >= 2) { largos++; if (bloqueadas[i] / vistas[i] >= .95) muyBloqueados++; } };
      while (!sim.fin && pasos++ < 900 * 30) {
        const j = sim.J[0]; if (j.cola.length) botEscoger(sim, j);
        quieto = infinito && exp.etapa >= Number(process.env.AFK_DESDE_ETAPA ?? 6) && sim.t >= afk.desde && sim.t < afk.hasta;
        if (quieto) {
          if (!afk.segundos) { afk.nivel = j.nivel; afk.armas = j.armas.map(a => a.id); }
          sim.mando(j.i, 0, 0, false); afk.vidaMinima = Math.min(afk.vidaMinima, j.hp);
        } else botSangre(sim, j);
        bloqueoIA.fill(0);
        const antesT = sim.t; sim.paso(DT);
        if (quieto) afk.segundos += sim.t - antesT;
        // Las elecciones de cartas y el Reloj parado no son aturdimiento de la IA.
        if (sim.t <= antesT || sim.quieto > 0) continue;
        const v = ventana();
        for (let i = 0; i < E.max; i++) {
          if (!E.vivo[i]) { if (uid[i]) { cerrar(i); uid[i] = 0; vistas[i] = bloqueadas[i] = racha[i] = 0; } continue; }
          if (uid[i] !== E.uid[i]) { if (uid[i]) cerrar(i); uid[i] = E.uid[i]; vistas[i] = bloqueadas[i] = racha[i] = 0; }
          if (esJefe(E.tipo[i]) || TIPOS[E.tipo[i]].conducta === 'quieto' || E.alt[i] < 0) continue;
          const dx = j.x - E.x[i], dy = j.y - E.y[i], dist = Math.hypot(dx, dy);
          if (dist > 8) { racha[i] = 0; continue; }
          if (tocados[i] === E.uid[i]) vistas[i] += DT;
          v.muestrasCerca++;
          if (pasoEstado ? bloqueoIA[i] && uidIA[i] === E.uid[i] : E.aturdido[i] > 0) {
            if (tocados[i] === E.uid[i]) bloqueadas[i] += DT;
            v.aturdidas++; racha[i] += DT;
            if (racha[i] > maxRacha) { maxRacha = racha[i]; maxId = TIPOS[E.tipo[i]].id; }
          } else racha[i] = 0;
          if (dist && (E.kx[i] * dx + E.ky[i] * dy) / dist < -E.vel[i] * (1 - E.lento[i])) v.retrocediendo++;
        }
      }
      assert.ok(sim.fin, 'La etapa debe finalizar sin forzar extracción ni derrota');
      for (let i = 0; i < E.max; i++) if (uid[i]) cerrar(i);
      const j = sim.J[0];
      etapas.push({ etapa: exp.etapa, segundos: red(sim.t), motivo: sim.fin.motivo, objetivo: sim.obj.tipo, nivel: j.nivel,
        afk: infinito ? { ...afk, segundos: red(afk.segundos), dano: red(afk.dano), vidaMinima: red(afk.vidaMinima) } : null,
        vidaFinal: red(j.hp), estadoJugador: j.estado, vidaMaxima: j.hpMax, golpesAturden, maxRacha: red(maxRacha), enemigoMaxRacha: maxId, enemigosObservadosDosSegundos: largos,
        enemigosBloqueados95Pct: muyBloqueados, porMin, armas: j.armas.map(a => ({ id: a.id, nivel: a.nivel, cadencia: red(a.p.cadencia), aturde: red(a.p.aturde) })) });
      exp.terminarEtapa();
      if (exp.fase === 'forja') {
        const f = exp.forja.get(j.i)!;
        for (const o of [...f.ofertas].sort((a, b) => (a.tipo === 'arma' ? -1 : 0) - (b.tipo === 'arma' ? -1 : 0))) if (j.oroSeguro >= o.precio) exp.comprar(j, o.id);
        for (let k = 0; k < j.armas.length; k++) { while (!exp.yunque(j, k)) {} exp.altarSangre(j, k); }
        if (exp.sim) botEscoger(exp.sim, j);
      }
    }
    const informe = { clase, perfil: modo, preparado: modo !== 'inicio', semilla, azarGlobalFijo: true,
      infinito, concluida: exp.fase === 'fin', revisionMotor: process.env.REVISION_MOTOR ?? 'árbol de trabajo',
      controlCC: process.env.REVISION_MOTOR ? null : { maxContinuo: 1.5, inmunidad: 1 },
      peligro: exp.cfg.peligro, victoria: exp.exito, etapas };
    informes.push(informe);
    console.log(`${modo} · ${clase} · ${semilla}: ${exp.fase !== 'fin' ? 'observación limitada' : exp.exito ? 'victoria' : 'derrota'}, etapas=${etapas.length}`);
  }
  writeFileSync(join(carpeta, 'sangre.json'), JSON.stringify({ alcance: 'Expediciones con piloto, decisiones y compras legales; arsenal completo preparado, sin bonos permanentes. Muestreo de estados por cuadro; no certifica teléfonos.', partidas: informes }, null, 2));
} else throw Error('Usa lavado, muerte, receta-muerte o sangre');

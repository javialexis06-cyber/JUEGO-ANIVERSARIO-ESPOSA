// «El Show de Nosotros»: el concurso de preguntas de la pareja, con el perrito de presentador.
// Este archivo lleva el programa de principio a fin: la entrada, las seis rondas (cada uno contesta en secreto y se
// revela al tiempo, con suspenso), el final con el medidor de conexión y lo que queda guardado en el libro.
// Sirve en los tres modos de la mesa: en línea (cada uno en su celular, lo principal), los dos en el mismo celular
// (se lo van pasando) y solo (contra las respuestas que el otro ya dejó guardadas; las nuevas quedan en el sobre).
import * as sonido from '../../sonido';
import type { ShowCasa } from '../../casa/show_casa';
import type { Canal } from '../canal';
import { casaShow, contarVictoria, marcarVistas, pagar, vistas } from './casa_show';
import type { Estudio } from './estudio';
import * as G from './guion';
import {
  armarPlan, calificar, completa, conexion, esAbierta, guardadoDe, infoRonda, type Item, type ModoShow, nivelConexion, otroRol, type Plan,
  type Resp, type Resultado, ROLES, SEG_ABIERTA, tarea,
} from './motor';
import { armar, NOMBRE, pregunta, type Pregunta, type Rol } from './preguntas';
import { type MsgShow, RedShow } from './red';
import { musica, SFX } from './sonidos';
import { UI } from './ui';

export interface OpcionesShow {
  modo: 'ia' | 'local' | 'linea';
  yo: Rol;
  empieza: Rol;
  /** El id de la partida (en línea, el mismo en los dos celulares). */
  id: string;
  canal: Canal | null;
  rapido: number;
  /** Vuelve al menú de la mesa. */
  alSalir: () => void;
  /** Volver a jugar (revancha): la mesa invita otra vez o arranca otro. */
  alRevancha: () => void;
}

interface Paso {
  ronda: number;
  k: number;
  item: Item;
  p: Pregunta;
}

class Cancelado extends Error {}

export class Show {
  readonly modo: ModoShow;
  readonly yo: Rol;
  plan: Plan | null = null;
  pasos: Paso[] = [];
  resp = new Map<number, Partial<Record<Rol, Resp>>>();
  notas = new Map<number, string>();
  resultados: (Resultado | null)[] = [];
  puntos: Record<Rol, number> = { el: 0, ella: 0 };
  show: ShowCasa | null = null;
  ui: UI;
  estudio: Estudio | null = null;
  private red: RedShow | null = null;
  private terminado = false;
  private cancelado = false;
  /** Pausa propia (app en segundo plano) y del otro (se fue a segundo plano o se le cayó la conexión). */
  private pausaLocal = false;
  private pausaRemota = false;
  private sinSenal = false;
  private avisos: (() => void)[] = [];
  private alPlan: ((p: Plan) => void) | null = null;
  private guardadas = new Set<number>();
  private perro = { nombre: 'Pelusa', pelaje: 'caramelo', hembra: false };
  private tPresencia = 0;
  private relojPresencia = 0;
  private fuente: 'local' | 'linea' | 'suelto' = 'suelto';

  constructor(public o: OpcionesShow) {
    this.modo = o.modo === 'ia' ? 'solo' : o.modo;
    this.yo = o.yo;
    this.ui = new UI(this.yo, this.modo, o.rapido, {
      salir: () => this.preguntarSalir(),
    });
    document.addEventListener('visibilitychange', this.alVisibilidad);
  }

  // ------------------------------------------------------------------------------------------------ Arranque
  async iniciar() {
    this.ui.cargando('Encendiendo las luces del estudio…');
    sonido.musica.callar(true);
    if (this.modo === 'linea' && this.o.canal) {
      this.red = new RedShow(this.o.canal, this.o.id, this.yo, (m) => this.mensaje(m));
      this.relojPresencia = window.setInterval(() => this.revisarPresencia(), 500);
    }
    const datos = await casaShow();
    this.show = datos.show;
    this.fuente = datos.fuente;
    if (datos.perro) this.perro = datos.perro;
    // El guion lo arma Él (en línea) o este celular; el otro lo recibe por la red
    const anfitrion = this.modo !== 'linea' || this.yo === 'el';
    if (anfitrion) {
      this.plan = armarPlan({
        id: this.o.id, modo: this.modo, yo: this.yo, empieza: this.o.empieza, show: this.show, vistas: vistas(), azar: Math.random, perro: this.perro,
      });
      this.red?.enviar({ k: 'plan', plan: this.plan });
    }
    // Mientras tanto, el estudio
    const { Estudio } = await import('./estudio');
    this.estudio = await Estudio.crear(this.ui.raiz, { yo: this.yo, perro: this.perro, rapido: this.o.rapido }).catch((e) => {
      console.error(e);
      return null;
    });
    if (!this.plan) {
      this.ui.cargando(`Esperando a que ${NOMBRE[otroRol(this.yo)]} entre al estudio…`);
      this.plan = await new Promise<Plan>((r) => (this.alPlan = r));
    }
    if (this.cancelado) return;
    this.perro = this.plan.perro;
    this.estudio?.ponerPerro(this.perro);
    this.pasos = this.plan.rondas.flatMap((r, ronda) => r.items.map((item, k) => ({ ronda, k, item, p: pregunta(item.id)! }))).filter((x) => !!x.p);
    marcarVistas(this.pasos.map((x) => x.item.id));
    this.ui.listo();
    try {
      await this.correr();
    } catch (e) {
      if (!(e instanceof Cancelado)) {
        console.error(e);
        this.ui.aviso('Algo falló en el show. Vuelve a intentarlo.');
        this.cerrar(true);
      }
    }
  }

  // ------------------------------------------------------------------------------------------------ Red
  private mensaje(m: MsgShow) {
    const o = otroRol(this.yo);
    if (m.k === 'plan') {
      if (!this.plan) {
        this.plan = m.plan;
        this.alPlan?.(m.plan);
      }
    } else if (m.k === 'r') {
      const r = this.resp.get(m.i) ?? {};
      r[o] = m.v;
      this.resp.set(m.i, r);
    } else if (m.k === 'nota') {
      this.notas.set(m.i, m.v);
    } else if (m.k === 'pausa') {
      this.pausaRemota = m.si;
      this.pintarPausa();
    } else if (m.k === 'chao') {
      if (!this.terminado) {
        this.ui.aviso(`${NOMBRE[o]} se salió del show.`, 3500);
        this.cerrar(false);
      }
    }
    this.avisar();
  }

  llega(id: string, n: number, m: unknown) {
    return this.red?.llega(id, n, m) ?? false;
  }

  private revisarPresencia() {
    if (!this.red) return;
    // Sin el otro en el canal un ratico = se le cayó la señal: el show se pausa con aviso hasta que vuelva
    const falta = !this.red.presente || !this.red.conectado;
    if (falta) this.tPresencia += 0.5;
    else this.tPresencia = 0;
    const sin = this.tPresencia >= 3;
    if (sin !== this.sinSenal) {
      this.sinSenal = sin;
      this.pintarPausa();
      if (!sin) this.red.pedirYa();
      this.avisar();
    }
  }

  private alVisibilidad = () => {
    const oculto = document.visibilityState === 'hidden';
    if (oculto === this.pausaLocal) return;
    this.pausaLocal = oculto;
    this.red?.enviar({ k: 'pausa', si: oculto });
    if (!oculto) {
      sonido.activar();
      this.red?.pedirYa();
    }
    this.estudio?.pausar(oculto);
    this.pintarPausa();
    this.avisar();
  };

  get pausado() {
    return this.pausaLocal || this.pausaRemota || this.sinSenal;
  }

  private pintarPausa() {
    const o = NOMBRE[otroRol(this.yo)];
    if (this.pausaLocal) this.ui.pausa('Show en pausa', 'Vuelve cuando quieras: aquí te esperamos.');
    else if (this.sinSenal) this.ui.pausa(`Se fue la señal de ${o}`, 'El show sigue apenas vuelva. El perrito está pidiendo que no se demore…', true);
    else if (this.pausaRemota) this.ui.pausa(`${o} pausó el show`, `Esperando a que ${o} vuelva al estudio…`, true);
    else this.ui.pausa(null);
    this.estudio?.pausar(this.pausado);
  }

  // ------------------------------------------------------------------------------------------------ Esperas
  private avisar() {
    const l = this.avisos;
    this.avisos = [];
    for (const f of l) f();
  }

  /** Espera hasta que se cumpla `cond` (se revisa con cada mensaje y cada tanto). */
  private hasta(cond: () => boolean, maxMs = Infinity): Promise<boolean> {
    const t0 = performance.now();
    return new Promise((ok) => {
      const mirar = () => {
        if (this.cancelado) return ok(false);
        if (cond()) return ok(true);
        if (performance.now() - t0 > maxMs) return ok(false);
        this.avisos.push(mirar);
        setTimeout(() => {
          const i = this.avisos.indexOf(mirar);
          if (i >= 0) {
            this.avisos.splice(i, 1);
            mirar();
          }
        }, 250);
      };
      mirar();
    });
  }

  /** Espera `ms` de show (no corre mientras está en pausa; en pruebas va más rápido). */
  dormir(ms: number): Promise<void> {
    let falta = ms / this.o.rapido;
    return new Promise((ok, mal) => {
      let antes = performance.now();
      const tic = () => {
        if (this.cancelado) return mal(new Cancelado());
        const ahora = performance.now();
        if (!this.pausado) falta -= ahora - antes;
        antes = ahora;
        if (falta <= 0) ok();
        else setTimeout(tic, Math.min(60, falta));
      };
      setTimeout(tic, Math.min(60, falta));
    });
  }

  private async libre() {
    if (this.cancelado) throw new Cancelado();
    if (this.pausado) await this.hasta(() => !this.pausado);
    if (this.cancelado) throw new Cancelado();
  }

  // ------------------------------------------------------------------------------------------------ El programa
  private async correr() {
    const plan = this.plan!;
    await this.intro();
    let i = 0;
    for (let r = 0; r < plan.rondas.length; r++) {
      await this.entradaRonda(r);
      const ronda = plan.rondas[r];
      if (ronda.tipo === 'zapato') {
        await this.relampago(i, ronda.items.length);
        i += ronda.items.length;
      } else {
        for (let k = 0; k < ronda.items.length; k++) {
          await this.unaPregunta(i);
          i++;
        }
      }
      void this.guardar(r);
    }
    await this.final();
  }

  private async intro() {
    const e = this.estudio;
    const perro = this.perro.nombre;
    musica('tema');
    this.ui.ronda(null);
    this.ui.marcador(this.puntos, false);
    e?.marcador(this.puntos);
    e?.animo('intro');
    e?.pantalla({ modo: 'logo' });
    e?.plano('grua', { corte: true });
    e?.publico('ovacion');
    SFX.aplausos(3, 1.2);
    let saltar = false;
    this.ui.botonSaltar(() => (saltar = true));
    const paso = async (ms: number) => {
      if (!saltar) await this.dormir(ms);
    };
    await this.ui.cortinilla('El Show de Nosotros', 'Esta noche, en vivo desde la casa');
    await paso(1500);
    e?.plano('presentador');
    this.ui.tercio(perro, this.perro.hembra ? 'Su presentadora' : 'Su presentador');
    await this.perroDice(G.frase(G.HOLA, { perro }), 2600, saltar);
    e?.plano('el');
    this.ui.tercio('ÉL', 'El panda · desde Bucaramanga', 'el');
    void e?.hacer('el', 'saludo');
    SFX.aplausos(1.4);
    await this.perroDice(G.frase(G.PRESENTO_EL), 2300, saltar);
    e?.plano('ella');
    this.ui.tercio('ELLA', 'La pulga aventurera · desde Sopetrán', 'ella');
    void e?.hacer('ella', 'saludo');
    SFX.aplausos(1.4);
    await this.perroDice(G.frase(G.PRESENTO_ELLA), 2300, saltar);
    this.ui.tercio(null);
    e?.plano('general');
    const reglas = this.modo === 'solo' ? G.frase(G.HOLA_SOLO, { quien: this.yo }) : this.modo === 'local' ? G.frase(G.HOLA_LOCAL) : G.frase(G.REGLAS);
    await this.perroDice(reglas, 2800, saltar);
    this.ui.botonSaltar(null);
    if (!saltar) await e?.calma(1500);
  }

  private async perroDice(texto: string, ms: number, rapido = false) {
    await this.libre();
    this.estudio?.perroHabla(true);
    this.ui.globoPerro(texto, this.perro.nombre, this.estudio);
    await this.dormir(rapido ? 500 : ms);
    this.estudio?.perroHabla(false);
  }

  private async entradaRonda(r: number) {
    const ronda = this.plan!.rondas[r];
    const info = infoRonda(ronda.tipo);
    await this.libre();
    const e = this.estudio;
    this.ui.globoPerro(null);
    musica('tema');
    SFX.whoosh();
    e?.animo('fiesta');
    e?.pantalla({ modo: 'ronda', titulo: `Ronda ${r + 1}`, texto: info.titulo, color: info.color });
    e?.plano('pantalla', { corte: true });
    this.ui.ronda({ n: r + 1, total: this.plan!.rondas.length, titulo: info.titulo });
    setTimeout(() => SFX.fanfarria(), 250 / this.o.rapido);
    await this.ui.entradaRonda(r + 1, info.titulo, info.sub, info.color);
    e?.plano('presentador');
    e?.perroAccion('senalar');
    await this.perroDice(G.frase(G.RONDA[ronda.tipo]), 2200);
    e?.publico('aplaudir');
  }

  // ------------------------------------------------------------------------------------------------ Una pregunta
  private async unaPregunta(i: number) {
    await this.libre();
    const { p, item, k, ronda } = this.pasos[i];
    const info = infoRonda(p.tipo);
    const e = this.estudio;
    this.ui.pregunta(k + 1, this.plan!.rondas[ronda].items.length);
    e?.listo('el', false);
    e?.listo('ella', false);
    e?.paleta('el', null);
    e?.paleta('ella', null);
    // El perrito lee la pregunta y sale en la pantalla gigante
    musica('suspenso');
    e?.animo('normal');
    e?.pantalla({ modo: 'pregunta', texto: this.textoPregunta(p, item), color: info.color });
    e?.plano(k % 2 ? 'presentador' : 'pantalla');
    SFX.whoosh();
    this.ui.globoPerro(null);
    this.ui.tercioPregunta(this.textoPregunta(p, item), p);
    e?.perroHabla(true);
    await this.dormir(900);
    e?.perroHabla(false);
    // A contestar: el panel a la derecha y la cámara encuadra a los dos (o a quien se pregunta) en lo que queda
    e?.plano(item.s ?? 'pareja');
    e?.encuadre(true);
    for (const r of ROLES) e?.pensando(r, true);
    const seg = esAbierta(p) ? SEG_ABIERTA : info.seg;
    await this.recoger(i, seg);
    for (const r of ROLES) e?.pensando(r, false);
    e?.encuadre(false);
    this.ui.tercioPregunta(null);
    await this.revelar(i);
  }

  /** Junta las respuestas de los dos según el modo. */
  private async recoger(i: number, seg: number) {
    const { p, item } = this.pasos[i];
    const r = this.resp.get(i) ?? {};
    this.resp.set(i, r);
    const o = otroRol(this.yo);
    const e = this.estudio;
    if (this.modo === 'local') {
      // Se lo van pasando: primero el que empieza (en «¿cuánto me conoces?», el que contesta sobre sí)
      const orden: Rol[] = item.s ? [item.s, otroRol(item.s)] : i % 2 ? [otroRol(this.plan!.empieza), this.plan!.empieza] : [this.plan!.empieza, otroRol(this.plan!.empieza)];
      for (let j = 0; j < 2; j++) {
        const quien = orden[j];
        await this.libre();
        await this.ui.pasarCelular(quien, j === 0 ? 'primero' : 'despues');
        r[quien] = await this.contestar(i, quien, seg);
        e?.listo(quien, true);
        void e?.hacer(quien, 'asentir');
        SFX.timbre();
      }
      await this.ui.pasarCelular(null, 'revelar');
      return;
    }
    if (this.modo === 'solo') {
      // Lo del otro sale del libro (si lo dejó); se demora un poquito en «contestar» para que se sienta vivo
      r[o] = guardadoDe(this.show!, p, item, o);
      const hay = completa(p, item, o, r[o]);
      const t = window.setTimeout(() => {
        e?.listo(o, true, !hay);
        if (hay) SFX.timbre();
      }, (900 + Math.random() * 2500) / this.o.rapido);
      r[this.yo] = await this.contestar(i, this.yo, seg);
      clearTimeout(t);
      e?.listo(o, true, !hay);
      e?.listo(this.yo, true);
      SFX.timbre();
      return;
    }
    // En línea: cada uno en su celular, al tiempo
    const mio = this.contestar(i, this.yo, seg, () => completa(p, item, o, this.resp.get(i)?.[o]));
    let otroListo = false;
    const vigilar = window.setInterval(() => {
      const ya = completa(p, item, o, this.resp.get(i)?.[o]);
      if (ya && !otroListo) {
        otroListo = true;
        e?.listo(o, true);
        SFX.timbre();
        void e?.hacer(o, 'asentir');
        this.ui.otroContesto();
      }
    }, 150);
    const v = await mio;
    r[this.yo] = v;
    this.red?.enviar({ k: 'r', i, v });
    e?.listo(this.yo, true);
    SFX.timbre();
    if (!completa(p, item, o, this.resp.get(i)?.[o])) {
      this.ui.esperandoOtro(G.frase(G.ESPERANDO_OTRO, { quien: this.yo }));
      // Si el otro no contesta ni con su reloj (se le cerró la app sin avisar), se pausa con aviso
      while (!(await this.hasta(() => completa(p, item, o, this.resp.get(i)?.[o]), (seg + 20) * 1000))) {
        if (this.cancelado) throw new Cancelado();
        this.sinSenal = true;
        this.pintarPausa();
        this.red?.pedirYa();
        await this.hasta(() => completa(p, item, o, this.resp.get(i)?.[o]) || (this.red?.presente ?? false), 6000);
        this.sinSenal = false;
        this.pintarPausa();
      }
      this.ui.esperandoOtro(null);
    }
    clearInterval(vigilar);
    if (!otroListo) {
      e?.listo(o, true);
      SFX.timbre();
    }
  }

  /** El panel para que `quien` conteste en este celular; con el reloj (que no corre en pausa). */
  private async contestar(i: number, quien: Rol, seg: number, otroYa?: () => boolean): Promise<Resp> {
    const { p, item } = this.pasos[i];
    const t = tarea(p, item, quien);
    void this.estudio?.hacer(quien, 'idea', 0.2);
    const r = await this.ui.panel({
      p, item, quien, tarea: t, seg,
      texto: () => this.textoPregunta(p, item),
      otroYa,
      pausado: () => this.pausado,
      cancelado: () => this.cancelado,
    });
    if (this.cancelado) throw new Cancelado();
    return r;
  }

  // ------------------------------------------------------------------------------------------------ Revelar
  private async revelar(i: number) {
    const { p, item } = this.pasos[i];
    const e = this.estudio;
    const r = this.resp.get(i) ?? {};
    await this.libre();
    // Suspenso: luces moradas, redoble y la cámara a los dos
    musica(null);
    e?.animo('suspenso');
    e?.plano('pareja', { corte: true });
    this.ui.globoPerro(G.frase(G.ANTES_DE_REVELAR), this.perro.nombre, e);
    SFX.redoble(1.3);
    if (p.tipo === 'quien') {
      e?.paleta('el', (r.el?.a as 'e' | 'a' | '-') ?? null);
      e?.paleta('ella', (r.ella?.a as 'e' | 'a' | '-') ?? null);
    }
    await this.dormir(1350);
    this.ui.globoPerro(null);
    // Las respuestas en las tarjetas (y en los atriles)
    let res = calificar(p, item, r, this.notas.get(i));
    await this.ui.revelar({ p, item, r, res, texto: () => this.textoPregunta(p, item) });
    // Abiertas: califica el dueño de la respuesta
    if (esAbierta(p) && res.etiqueta === 'Falta calificar') res = await this.calificarAbierta(i);
    this.resultados[i] = res;
    await this.reaccionar(i, res);
  }

  private async calificarAbierta(i: number): Promise<Resultado> {
    const { p, item } = this.pasos[i];
    const s = item.s!;
    const r = this.resp.get(i) ?? {};
    const quienCalifica: Rol = this.modo === 'linea' ? s : this.modo === 'local' ? s : this.yo;
    this.ui.globoPerro(G.frase(G.NOTA, { quien: quienCalifica }), this.perro.nombre, this.estudio);
    if (this.modo !== 'linea' || quienCalifica === this.yo) {
      const v = await this.ui.calificar(quienCalifica, this.modo === 'solo' && s !== this.yo);
      this.notas.set(i, v);
      if (this.modo === 'linea') this.red?.enviar({ k: 'nota', i, v });
    } else {
      this.ui.esperandoOtro(`${NOMBRE[s]} está calificando tu respuesta…`);
      await this.hasta(() => this.notas.has(i));
      this.ui.esperandoOtro(null);
    }
    this.ui.globoPerro(null);
    const res = calificar(p, item, r, this.notas.get(i));
    this.ui.sello(res);
    return res;
  }

  private async reaccionar(i: number, res: Resultado) {
    const { p, item } = this.pasos[i];
    const e = this.estudio;
    const perro = this.perro.nombre;
    // Puntos y sonido
    for (const r of ROLES) this.puntos[r] += res.pts[r];
    if (res.pendiente && res.con === null) {
      SFX.sobre();
      e?.animo('normal');
      this.ui.globoPerro(G.frase(G.PENDIENTE, { quien: this.yo }), perro, e);
      void e?.hacer(this.yo, 'encogerse');
      await this.dormir(2300);
      this.ui.globoPerro(null);
      this.ui.limpiarRevelar();
      return;
    }
    if (res.tono === 'bien') {
      SFX.ding();
      setTimeout(() => SFX.aplausos(2, 1.1), 250);
      e?.animo('bien');
      e?.confeti();
      e?.publico('ovacion');
      e?.perroAccion('saltar');
    } else if (res.tono === 'casi') {
      SFX.casi();
      setTimeout(() => SFX.uuh(), 200);
      e?.animo('normal');
      e?.publico('aplaudir');
      e?.perroAccion('sorpresa');
    } else if (res.tono === 'mal') {
      SFX.bzzz();
      setTimeout(() => SFX.ohh(), 350);
      e?.animo('mal');
      e?.publico('ohh');
      e?.perroAccion('reir');
    } else {
      SFX.bzzz();
      e?.animo('mal');
    }
    this.ui.marcador(this.puntos, true);
    e?.marcador(this.puntos);
    if (ROLES.some((r) => res.pts[r] > 0)) setTimeout(() => SFX.puntos(), 500);
    // Lo que hace cada uno (y lo que dicen en su globito)
    const lista = res.tono === 'bien' ? G.POR_TIPO_BIEN[p.tipo] ?? G.BIEN : res.tono === 'casi' ? G.CASI : res.tono === 'mal' ? G.POR_TIPO_MAL[p.tipo] ?? G.MAL : G.NADA;
    this.ui.globoPerro(G.frase(lista, { perro }), perro, e);
    this.actuar(i, res);
    if (p.tipo === 'historia') {
      await this.dormir(1600);
      this.ui.globoPerro(p.dato, perro, e);
      await this.dormir(2600);
    } else await this.dormir(res.tono === 'bien' ? 2900 : 2500);
    this.ui.globoPerro(null);
    this.ui.limpiarRevelar();
    await e?.calma(1800);
  }

  /** Las reacciones de los muñecos según quién atinó. */
  private actuar(i: number, res: Resultado) {
    const { p, item } = this.pasos[i];
    const e = this.estudio;
    if (!e) return;
    const dice = (r: Rol, k: keyof typeof G.DICE, demora = 0.6) => setTimeout(() => e.decir(r, G.una(G.DICE[k][r])), demora * 1000 / this.o.rapido);
    if (p.tipo === 'quien' || p.tipo === 'zapato') {
      const voto = this.resp.get(i)?.el?.a;
      if (res.tono === 'bien') {
        const elegido: Rol | null = voto === 'e' ? 'el' : voto === 'a' ? 'ella' : null;
        if (elegido) {
          void e.hacer(otroRol(elegido), 'senalar_reir', 0.2);
          void e.hacer(elegido, Math.random() < 0.5 ? 'facepalm' : 'encogerse', 0.4);
        } else {
          void e.hacer('el', 'chocar_cinco');
          void e.hacer('ella', 'chocar_cinco');
        }
        dice('el', 'bien');
      } else if (res.tono === 'mal') {
        void e.hacer('el', Math.random() < 0.5 ? 'boca_abierta' : 'brazos_cruzados', 0.1);
        void e.hacer('ella', Math.random() < 0.5 ? 'enojo' : 'senalar_reir', 0.35);
        dice('ella', 'mal');
      }
      return;
    }
    if (p.tipo === 'conoce' || p.tipo === 'termo') {
      const s = item.s!, q = otroRol(s);
      const a = res.atino[q];
      if (a === 'si') {
        void e.hacer(q, Math.random() < 0.5 ? 'salto_confeti' : 'presumir');
        void e.hacer(s, Math.random() < 0.5 ? 'sonrojarse' : 'aplauso_mala_gana', 0.4);
        dice(q, 'bien');
        dice(s, 'meAtinaron', 1.4);
      } else if (a === 'casi') {
        void e.hacer(q, 'rascarse');
        void e.hacer(s, 'alivio', 0.3);
        dice(q, 'casi');
      } else if (a === 'no') {
        void e.hacer(q, Math.random() < 0.5 ? 'facepalm' : 'puchero');
        void e.hacer(s, Math.random() < 0.5 ? 'brazos_cruzados' : 'enojo', 0.35);
        dice(s, 'noMeConoce', 0.9);
      }
      return;
    }
    // Qué prefieres e historia: cada uno con lo suyo
    for (const r of ROLES) {
      const a = res.atino[r];
      if (a === 'si') void e.hacer(r, ['pulgares', 'puno_aire', 'bailecito', 'celebrar'][Math.floor(Math.random() * 4)], r === 'el' ? 0 : 0.25);
      else if (a === 'no') void e.hacer(r, ['puchero', 'rascarse', 'gotita', 'encogerse'][Math.floor(Math.random() * 4)], r === 'el' ? 0 : 0.25);
    }
    if (res.tono === 'bien' && p.tipo === 'prefiere' && res.etiqueta.includes('gemelas')) {
      setTimeout(() => {
        void e.hacer('el', 'abrazo');
        void e.hacer('ella', 'abrazo');
      }, 1300 / this.o.rapido);
    }
    const quien = ROLES.find((r) => res.atino[r] === 'si') ?? ROLES.find((r) => res.atino[r] === 'no');
    if (quien) dice(quien, res.atino[quien] === 'si' ? 'bien' : 'mal');
  }

  // ------------------------------------------------------------------------------------------------ Relámpago
  private async relampago(i0: number, n: number) {
    const e = this.estudio;
    const o = otroRol(this.yo);
    const info = infoRonda('zapato');
    const lista = this.pasos.slice(i0, i0 + n);
    await this.libre();
    e?.animo('relampago');
    e?.plano('pareja');
    this.ui.globoPerro(G.frase(G.RELAMPAGO_YA), this.perro.nombre, e);
    const jugar = async (quien: Rol): Promise<Resp[]> => {
      musica('relampago');
      e?.encuadre(true);
      const v = await this.ui.relampago({
        quien, preguntas: lista.map((x) => this.textoPregunta(x.p, x.item)), seg: info.seg,
        pausado: () => this.pausado, cancelado: () => this.cancelado,
        alContestar: (k, voto) => {
          e?.paleta(quien, voto as 'e' | 'a');
          if (k === n - 1) e?.listo(quien, true);
        },
      });
      e?.encuadre(false);
      musica(null);
      if (this.cancelado) throw new Cancelado();
      return v.map((a) => ({ a }));
    };
    if (this.modo === 'local') {
      const orden: Rol[] = [this.plan!.empieza, otroRol(this.plan!.empieza)];
      for (const quien of orden) {
        await this.ui.pasarCelular(quien, 'primero');
        const v = await jugar(quien);
        v.forEach((x, k) => this.resp.set(i0 + k, { ...this.resp.get(i0 + k), [quien]: x }));
      }
      await this.ui.pasarCelular(null, 'revelar');
    } else {
      if (this.modo === 'solo') lista.forEach((x, k) => this.resp.set(i0 + k, { [o]: guardadoDe(this.show!, x.p, x.item, o) }));
      const v = await jugar(this.yo);
      v.forEach((x, k) => {
        const r = this.resp.get(i0 + k) ?? {};
        r[this.yo] = x;
        this.resp.set(i0 + k, r);
        this.red?.enviar({ k: 'r', i: i0 + k, v: x });
      });
      if (this.modo === 'linea') {
        const todos = () => lista.every((x, k) => this.resp.get(i0 + k)?.[o]?.a !== undefined);
        if (!todos()) {
          this.ui.esperandoOtro(G.frase(G.ESPERANDO_OTRO, { quien: this.yo }));
          while (!(await this.hasta(todos, 45_000))) {
            this.sinSenal = true;
            this.pintarPausa();
            this.red?.pedirYa();
            await this.hasta(() => todos() || (this.red?.presente ?? false), 6000);
            this.sinSenal = false;
            this.pintarPausa();
          }
          this.ui.esperandoOtro(null);
        }
      }
    }
    e?.listo('el', true);
    e?.listo('ella', true);
    // Revelación en ráfaga: una por una, rapidito, con los dos levantando su paleta
    this.ui.globoPerro(null);
    musica(null);
    e?.animo('suspenso');
    SFX.redoble(1.1);
    await this.dormir(1100);
    musica('relampago');
    let coinciden = 0;
    for (let k = 0; k < n; k++) {
      await this.libre();
      const r = this.resp.get(i0 + k) ?? {};
      const res = calificar(lista[k].p, lista[k].item, r);
      this.resultados[i0 + k] = res;
      e?.paleta('el', (r.el?.a as 'e' | 'a' | '-') ?? null);
      e?.paleta('ella', (r.ella?.a as 'e' | 'a' | '-') ?? null);
      for (const q of ROLES) this.puntos[q] += res.pts[q];
      if (res.tono === 'bien') {
        coinciden++;
        SFX.ding();
        e?.animo('bien');
      } else if (res.pendiente) SFX.sobre();
      else {
        SFX.bzzz();
        e?.animo('mal');
      }
      this.ui.fichaRelampago(k, n, this.textoPregunta(lista[k].p, lista[k].item), r, res);
      this.ui.marcador(this.puntos, res.tono === 'bien');
      e?.marcador(this.puntos);
      await this.dormir(1150);
    }
    musica(null);
    this.ui.limpiarRevelar();
    e?.paleta('el', null);
    e?.paleta('ella', null);
    const total = lista.filter((_, k) => !this.resultados[i0 + k]?.pendiente).length;
    if (coinciden >= Math.ceil(total * 0.7)) {
      e?.confeti();
      SFX.aplausos(2.5, 1.3);
      e?.publico('ovacion');
      void e?.hacer('el', 'chocar_cinco');
      void e?.hacer('ella', 'chocar_cinco');
    } else e?.publico('aplaudir');
    this.ui.globoPerro(`¡${coinciden} de ${total}! ${coinciden >= total * 0.7 ? '¡Qué bárbaros!' : coinciden >= total * 0.4 ? 'Nada mal, nada mal.' : 'Uy… hay que hablar más.'}`, this.perro.nombre, e);
    await this.dormir(2400);
    this.ui.globoPerro(null);
    await e?.calma(1500);
  }

  // ------------------------------------------------------------------------------------------------ Final
  private async final() {
    const e = this.estudio;
    const perro = this.perro.nombre;
    await this.libre();
    this.terminado = true;
    musica(null);
    e?.animo('suspenso');
    e?.plano('general', { corte: true });
    const con = conexion(this.resultados);
    const pts = this.puntos;
    const ganador: Rol | null = pts.el === pts.ella ? null : pts.el > pts.ella ? 'el' : 'ella';
    this.ui.globoPerro('¡Llegó el momento! El medidor de conexión de esta noche…', perro, e);
    SFX.redoble(1.6);
    await this.dormir(1700);
    this.ui.globoPerro(null);
    e?.pantalla({ modo: 'medidor', valor: con });
    e?.plano('pantalla');
    await this.ui.medidor(con, nivelConexion(con));
    SFX.fanfarriaGrande();
    e?.animo('fiesta');
    e?.confeti(true);
    e?.publico('ovacion');
    SFX.aplausos(3.5, 1.4);
    await this.dormir(1600);
    // El ganador (jugando solo no hay contra quién: cuenta la conexión)
    e?.plano('pareja');
    const textoGanador = this.modo === 'solo' ? `¡${con}% de conexión con ${NOMBRE[otroRol(this.yo)]}!` : ganador ? G.frase(G.FINAL_GANA, { quien: ganador }) : G.frase(G.FINAL_EMPATE);
    this.ui.globoPerro(textoGanador, perro, e);
    e?.perroAccion('aplaudir');
    musica('tema');
    const fin = e?.final(this.modo === 'solo' ? null : ganador);
    if (ganador && this.modo !== 'solo') {
      setTimeout(() => e?.decir(ganador, G.una(G.DICE.gano[ganador])), 1400 / this.o.rapido);
      setTimeout(() => e?.decir(otroRol(ganador), G.una(G.DICE.pierde[otroRol(ganador)])), 2600 / this.o.rapido);
    }
    await this.dormir(2600);
    // Premio: monedas escasas para la casa y una victoria para el trofeo de la mesa
    const monedas = this.modo === 'solo' ? 2 + (con >= 80 ? 1 : 0) : 3 + (con >= 80 ? 1 : 0);
    pagar(monedas);
    const gane = this.modo === 'solo' ? con >= 70 : ganador === null || (this.modo === 'local' ? true : ganador === this.yo);
    if (gane) contarVictoria();
    if (this.modo === 'local' && ganador === null) contarVictoria();
    const guardado = this.guardarEpisodio(con);
    this.ui.globoPerro(G.frase(G.DESPEDIDA), perro, e);
    void fin;
    await this.ui.final({
      puntos: pts, ganador, con, nivel: nivelConexion(con), monedas, modo: this.modo,
      pendientes: this.resultados.filter((r) => r?.pendiente).length,
      alOtro: () => {
        this.cerrar(false);
        this.o.alRevancha();
      },
      alLibro: async () => {
        await guardado;
        const { abrirLibro } = await import('./libro');
        await abrirLibro(this.yo);
      },
      alSalir: () => this.cerrar(false),
    });
  }

  // ------------------------------------------------------------------------------------------------ Guardar
  /** Lo contestado en una ronda queda en el libro (cada celular guarda lo suyo; en el mismo celular, lo de los dos). */
  private async guardar(ronda: number) {
    if (this.guardadas.has(ronda)) return;
    this.guardadas.add(ronda);
    const pasos = this.pasos.map((x, i) => ({ ...x, i })).filter((x) => x.ronda === ronda);
    const mios: Rol[] = this.modo === 'local' ? ['el', 'ella'] : [this.yo];
    await casaShow((s) => {
      for (const { item, i, p } of pasos) {
        const r = this.resp.get(i);
        for (const q of mios) {
          const v = r?.[q];
          if (!v) continue;
          if (v.a !== undefined && v.a !== '-') s.r[q][item.id] = v.a.slice(0, 90);
          if (v.g !== undefined && v.g !== '-') s.g[q][item.id] = v.g.slice(0, 90);
        }
        const nota = this.notas.get(i);
        // La calificación la guarda quien la puso (el dueño de la respuesta; jugando solo, este celular)
        if (nota !== undefined && esAbierta(p) && item.s && (this.modo !== 'linea' || item.s === this.yo)) s.c[otroRol(item.s)][item.id] = nota;
      }
    }).then((d) => {
      if (d.guardado) this.show = d.show;
    });
  }

  private async guardarEpisodio(con: number) {
    for (let r = 0; r < (this.plan?.rondas.length ?? 0); r++) await this.guardar(r);
    // El episodio lo anota uno solo (Él en línea; este celular en los otros modos)
    if (this.modo === 'linea' && this.yo !== 'el') return;
    const q = this.pasos.map((x) => (x.item.s ? `${x.item.id}:${x.item.s === 'el' ? 'e' : 'a'}` : x.item.id));
    await casaShow((s) => {
      if (s.ep.some((e) => e.id === this.o.id)) return;
      s.ep.push({ id: this.o.id, t: Date.now(), m: this.modo, ...(this.modo === 'solo' ? { de: this.yo } : {}), p: { ...this.puntos }, c: con, q });
      s.ep = s.ep.slice(-60);
    });
  }

  // ------------------------------------------------------------------------------------------------ Textos
  textoPregunta(p: Pregunta, item: Item): string {
    return armarTexto(p, item);
  }

  // ------------------------------------------------------------------------------------------------ Salir
  atras() {
    this.preguntarSalir();
  }

  private preguntarSalir() {
    if (this.terminado) return this.cerrar(false);
    this.ui.confirmar('¿Salir del show?', this.modo === 'linea' ? `Se acaba el show para los dos. Lo contestado hasta ahora queda en el libro.` : 'Lo contestado hasta ahora queda guardado en el libro.', () => {
      this.cerrar(true);
    });
  }

  cerrar(avisar: boolean) {
    if (this.cancelado) return;
    this.cancelado = true;
    this.avisar();
    // Lo que alcanzaron a contestar no se pierde
    if (this.plan) for (let r = 0; r < this.plan.rondas.length; r++) void this.guardar(r);
    this.red?.cerrar(avisar && !this.terminado);
    clearInterval(this.relojPresencia);
    document.removeEventListener('visibilitychange', this.alVisibilidad);
    musica(null);
    this.estudio?.destruir();
    this.estudio = null;
    this.ui.destruir();
    sonido.musica.callar(false);
    if (actual === this) actual = null;
    this.o.alSalir();
  }
}

/** El texto de una pregunta tal como se ve (con el nombre de quien se habla). */
export function armarTexto(p: Pregunta, item: Item): string {
  return p.tipo === 'conoce' || p.tipo === 'termo' ? armar(p.t, item.s ?? 'el') : p.t;
}

// ------------------------------------------------------------------------------------------------ Lo que usa la mesa
let actual: Show | null = null;

export async function abrirShow(o: OpcionesShow) {
  actual?.cerrar(false);
  const s = new Show(o);
  actual = s;
  (globalThis as Record<string, unknown>).__show = {
    get show() {
      return actual;
    },
    banco: async () => (await import('./preguntas')).revisarBanco(),
  };
  await s.iniciar();
}

/** Mensajes del canal de la mesa para el show (true si eran suyos). */
export const llegaShow = (id: string, n: number, m: unknown) => actual?.llega(id, n, m) ?? false;

/** El otro cerró el show desde la mesa. */
export function salioShow(id: string) {
  if (actual && actual.o.id === id) {
    actual.ui.aviso(`${NOMBRE[otroRol(actual.yo)]} se salió del show.`, 3500);
    actual.cerrar(false);
  }
}

export const showAbierto = () => !!actual;

/** El botón de atrás del celular: pregunta antes de salir del show. */
export function atrasShow() {
  actual?.atras();
}

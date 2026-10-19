// Entrada de «Plantas contra Zombis: La Semilla Madre» en jardin.html: pantalla de título, mapa de la aventura,
// opciones y paso a los patios clásicos o al duelo para dos. Las pruebas usan ?bot, ?rapido=N, ?semilla=N y
// ?pvz=<nivel> (va directo a ese nivel) y el objeto window.__pvz.
import './ui/pvz.css';
import { esModoAmigo } from '../../salas/perfil';
import { nivelPorId } from './datos/niveles';
import { Partida } from './aventura';
import { Guardado } from './guardado';
import { sonido } from './sonido';
import { pantallaMapa, pantallaTitulo } from './ui/pantallas';

const PRONTO = 'Próximamente';

export function iniciarPvZ(): void {
  const params = new URLSearchParams(location.search);
  const amigo = esModoAmigo();
  const guardado = new Guardado(amigo ? 'amigo-pvz-v1' : 'pvz-v1');
  sonido.efectos = guardado.progreso.ajustes.efectos;
  sonido.musica = guardado.progreso.ajustes.musica;
  document.body.classList.add('pvz');
  const raiz = document.createElement('main');
  raiz.className = 'pvz-app';
  document.body.append(raiz);

  let pantalla: HTMLElement | null = null;
  let partida: Partida | null = null;
  let estado: 'titulo' | 'mapa' | 'partida' | 'opciones' = 'titulo';

  const limpiar = () => {
    pantalla?.remove();
    pantalla = null;
    partida?.destruir();
    partida = null;
  };

  const conParams = (pagina: string, extra: Record<string, string> = {}) => {
    const u = new URL(pagina, location.href);
    for (const k of ['rol', 'local', 'salas']) if (params.has(k)) u.searchParams.set(k, params.get(k)!);
    for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
    return u.href;
  };

  const titulo = () => {
    limpiar();
    estado = 'titulo';
    sonido.ponerMusica('titulo');
    pantalla = pantallaTitulo(raiz, {
      nivelActual: guardado.nivelActual(),
      bloqueos: { minijuegos: PRONTO, rompecabezas: PRONTO, supervivencia: PRONTO, fusion: PRONTO, almanaque: PRONTO, tienda: PRONTO },
      alElegir: (a) => {
        if (a === 'aventura') {
          // La primera vez se entra directo al primer nivel, como en PvZ.
          if (!guardado.progreso.completados.length) jugar(guardado.nivelActual());
          else mapa();
        } else if (a === 'clasicos') location.href = conParams('./jardin.html', { clasicos: '1' });
        else if (a === 'dos') location.href = conParams('./jardin-duelo.html');
        else if (a === 'opciones') opciones();
        else if (a === 'salir') {
          const u = new URL(amigo ? './amigos.html' : './index.html', location.href);
          if (!amigo) {
            u.searchParams.set('desdePatio', '1');
            for (const k of ['rol', 'local']) if (params.has(k)) u.searchParams.set(k, params.get(k)!);
          }
          location.href = u.href;
        }
      },
    });
  };

  const mapa = (mundo?: number) => {
    limpiar();
    estado = 'mapa';
    sonido.ponerMusica('mapa');
    const actual = guardado.nivelActual();
    pantalla = pantallaMapa(raiz, {
      completados: guardado.progreso.completados, actual, mundo: mundo ?? nivelPorId(actual)?.mundo ?? 1,
      alJugar: (id) => jugar(id),
      alVolver: () => titulo(),
    });
  };

  const jugar = (id: string) => {
    limpiar();
    estado = 'partida';
    partida = new Partida({
      raiz, guardado, bot: params.has('bot'), rapido: Math.max(1, Number(params.get('rapido') ?? 1) || 1),
      semilla: params.has('semilla') ? Number(params.get('semilla')) || 1 : null,
      alSalir: (destino, mundo) => (destino === 'mapa' ? mapa(mundo) : titulo()),
    });
    void partida.jugar(id);
  };

  const opciones = () => {
    estado = 'opciones';
    const a = guardado.progreso.ajustes;
    const p = document.createElement('section');
    p.className = 'pvz-mensaje';
    const pintar = () => {
      p.innerHTML = `<div class="libro"><h2>Opciones</h2>
        <button class="pvz-boton" data-o="efectos">Efectos de sonido: ${a.efectos ? 'sí' : 'no'}</button>
        <button class="pvz-boton" data-o="musica">Música: ${a.musica ? 'sí' : 'no'}</button>
        <button class="pvz-boton" data-o="recoger">Recoger soles al pasar el dedo: ${a.recogerAlPasar ? 'sí' : 'no'}</button>
        <button class="pvz-boton grande" data-o="listo">Listo</button></div>`;
      for (const b of p.querySelectorAll<HTMLButtonElement>('[data-o]')) {
        b.addEventListener('click', () => {
          sonido.desbloquear();
          sonido.efecto('boton');
          const o = b.dataset.o;
          if (o === 'efectos') sonido.efectos = a.efectos = !a.efectos;
          else if (o === 'musica') sonido.alternarMusica((a.musica = !a.musica));
          else if (o === 'recoger') a.recogerAlPasar = !a.recogerAlPasar;
          guardado.guardar();
          if (o === 'listo') {
            p.remove();
            estado = 'titulo';
          } else pintar();
        });
      }
    };
    pintar();
    raiz.append(p);
  };

  (window as unknown as { __pvz: unknown }).__pvz = {
    estado: () => estado,
    partida: () => partida,
    motor: () => partida?.motor ?? null,
    vista: () => partida?.escena ?? null,
    avanzar: (n: number) => partida?.avanzar(n),
    progreso: () => guardado.progreso,
    guardado,
    jugar,
    mapa,
    titulo,
  };

  const directo = params.get('pvz');
  if (directo && nivelPorId(directo)) jugar(directo);
  else titulo();
}

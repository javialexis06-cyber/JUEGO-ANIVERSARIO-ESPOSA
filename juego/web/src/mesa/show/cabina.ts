// La cabina del show: lo primero que se ve al tocar «El Show de Nosotros» en la mesa. La marquesina con sus bombillos,
// cómo se va a jugar, sus números (shows, mejor conexión, lo que hay en el sobre), la pregunta del día (también se
// contesta aquí) y el libro de nosotros. «¡Que empiece el show!» sigue con el modo que esté escogido en la mesa.
import './show.css';
import type { Modo } from '../tipos';
import { casaShow, pagar } from './casa_show';
import { NOMBRE, type Rol } from './preguntas';
import { SFX } from './sonidos';
import { activar } from '../../sonido';

const MODO: Record<Modo, (yo: Rol) => string> = {
  linea: (yo) => `En línea: cada uno en su celular. Le llega la invitación a ${NOMBRE[yo === 'el' ? 'ella' : 'el']}.`,
  local: () => 'Los dos aquí: se pasan el celular y el otro cierra los ojos.',
  ia: (yo) => `Solo: contra las respuestas que ${NOMBRE[yo === 'el' ? 'ella' : 'el']} ya dejó guardadas (las nuevas quedan en el sobre).`,
};

/** Muestra la cabina; true si tocaron «¡Que empiece el show!». */
export async function abrirCabina(yo: Rol, modo: Modo): Promise<boolean> {
  document.querySelector('.cabina')?.remove();
  activar();
  const c = document.createElement('section');
  c.className = 'cabina';
  c.innerHTML = `<div class="cabina-luces"></div>
    <article class="cabina-marquesina">
      <button class="cabina-cerrar" aria-label="Volver a la mesa">×</button>
      <div class="cabina-bombillos">${Array.from({ length: 22 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div>
      <h1><span>El Show</span><small>de Nosotros</small></h1>
      <p class="cabina-sub">El concurso donde se sabe quién conoce más al otro. Presenta: el perrito de la casa 🐶🎤</p>
      <p class="cabina-modo"></p>
      <div class="cabina-numeros"><span>…</span></div>
      <div class="cabina-botones">
        <button class="show-btn show-btn-papel" data-c="dia">💌 Pregunta del día</button>
        <button class="show-btn show-btn-papel" data-c="libro">📖 El libro</button>
        <button class="show-btn show-btn-oro cabina-empezar" data-c="empezar">🎬 ¡Que empiece el show!</button>
      </div>
    </article>
    <div class="cabina-dia" hidden><div class="cabina-dia-hoja"><button class="cabina-cerrar" data-c="cerrar-dia" aria-label="Cerrar">×</button><div class="cabina-dia-cuerpo"></div></div></div>`;
  c.querySelector('.cabina-modo')!.textContent = MODO[modo](yo);
  document.body.append(c);
  SFX.golpe();
  // Sus números, del libro
  void casaShow().then(({ show }) => {
    const mejor = show.ep.reduce((m, e) => Math.max(m, e.c), 0);
    const o: Rol = yo === 'el' ? 'ella' : 'el';
    let sobre = 0;
    for (const id of Object.keys(show.r[o])) if (show.r[yo][id] === undefined && !id.startsWith('h')) sobre++;
    const dia = show.dia && show.r[yo][show.dia.q] === undefined;
    c.querySelector('.cabina-numeros')!.innerHTML = `<span><b>${show.ep.length}</b> shows</span><span><b>${mejor}%</b> mejor conexión</span><span><b>${sobre}</b> en el sobre para ti</span>`;
    if (dia) c.querySelector('[data-c="dia"]')!.classList.add('pendiente');
  });
  return new Promise<boolean>((listo) => {
    const cerrar = (si: boolean) => {
      c.classList.add('sale');
      setTimeout(() => c.remove(), 320);
      listo(si);
    };
    c.addEventListener('click', async (ev) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('button');
      if (!b) return;
      SFX.toque();
      const que = b.dataset.c;
      if (b.classList.contains('cabina-cerrar') && !que) cerrar(false);
      else if (que === 'empezar') cerrar(true);
      else if (que === 'libro') {
        const { abrirLibro } = await import('./libro');
        await abrirLibro(yo);
      } else if (que === 'cerrar-dia') (c.querySelector('.cabina-dia') as HTMLElement).hidden = true;
      else if (que === 'dia') {
        const hoja = c.querySelector('.cabina-dia') as HTMLElement;
        hoja.hidden = false;
        const { montarPreguntaDia } = await import('../../casa/pregunta_dia');
        await montarPreguntaDia(hoja.querySelector('.cabina-dia-cuerpo') as HTMLElement, {
          yo,
          leer: async () => (await casaShow()).show,
          cambiar: async (fn) => {
            const d = await casaShow((s, casa) => {
              const m = { monedas: typeof casa.monedas === 'number' ? casa.monedas : undefined };
              const antes = m.monedas ?? 0;
              fn(s, m);
              const gano = (m.monedas ?? 0) - antes;
              if (gano > 0) {
                if (typeof casa.monedas === 'number') casa.monedas = m.monedas;
                else pagar(gano);
              }
            });
            return d.guardado ? d.show : null;
          },
          celebrar: () => {
            SFX.ding();
            SFX.aplausos(1.6);
          },
          alLibro: async () => {
            const { abrirLibro } = await import('./libro');
            await abrirLibro(yo);
          },
        });
        c.querySelector('[data-c="dia"]')!.classList.remove('pendiente');
      }
    });
  });
}

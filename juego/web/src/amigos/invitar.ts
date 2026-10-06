// «Invitar amigos» (lo usan Javier y Laura desde el menú de la casa): comparte por WhatsApp (o copia) un mensaje con
// los enlaces de descarga de la versión para amigos (la app y el programa de computador, sin nada de la pareja) y,
// si hay una sala abierta en este aparato, su código para entrar de una. Solo va en la versión de la pareja: la de
// los amigos comparte el código desde la sala de espera.
import { salaAbierta } from '../salas/sala';
import { JUEGOS } from './juegos';

const RELEASES = 'https://github.com/javialexis06-cyber/juego-aniversario-esposa/releases/latest/download';
export const DESCARGA_AMIGOS = { apk: `${RELEASES}/NuestroHogar-Amigos.apk`, exe: `${RELEASES}/NuestroHogar-Amigos.exe` };

/** El mensaje de la invitación (con el código de la sala abierta, si hay). */
export function mensajeInvitacion(): string {
  const sala = salaAbierta();
  const juego = sala ? JUEGOS.find((j) => j.sala === sala.juego)?.nombre ?? 'la sala' : '';
  return [
    '¡Ven a jugar conmigo! 🎮 Descarga la Sala de juegos (es gratis):',
    `📱 Android: ${DESCARGA_AMIGOS.apk}`,
    `💻 Computador (Windows): ${DESCARGA_AMIGOS.exe}`,
    'En Android, cuando el celular pregunte, permite «instalar apps de fuentes desconocidas».',
    sala ? `\nAhora mismo estoy en ${juego}: abre la app, toca «Unirme con un código» y escribe ${sala.codigo}` : '',
  ].filter(Boolean).join('\n');
}

function avisito(texto: string) {
  const a = document.createElement('div');
  a.textContent = texto;
  a.setAttribute('role', 'status');
  a.style.cssText = 'position:fixed;left:50%;top:16px;translate:-50% 0;z-index:9999;max-width:80vw;padding:9px 18px;border-radius:14px;' +
    'background:rgba(30,18,28,.92);color:#fff;font:700 14px/1.3 Nunito,system-ui,sans-serif;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.35)';
  document.body.append(a);
  setTimeout(() => a.remove(), 3000);
}

/** Muestra el mensaje para copiarlo a mano (si el celular no deja compartir ni copiar). */
function mostrar(texto: string) {
  const capa = document.createElement('div');
  capa.style.cssText = 'position:fixed;inset:0;z-index:9998;display:grid;place-items:center;background:rgba(20,12,20,.6)';
  capa.innerHTML = `<div style="width:min(520px,88vw);padding:14px 16px;border-radius:18px;background:#fff8ee;color:#3d2b27;font:700 13px/1.35 Nunito,system-ui,sans-serif">
    <b style="font:700 18px Fredoka,system-ui,sans-serif;color:#b0506d">Invitar amigos</b><p style="margin:6px 0">Copia este mensaje y mándaselo a tus amigos:</p>
    <textarea readonly style="width:100%;height:140px;box-sizing:border-box;border-radius:10px;border:2px solid #f2a5b8;padding:8px;font:600 12px/1.35 Nunito,system-ui,sans-serif"></textarea>
    <div style="text-align:right;margin-top:8px"><button style="border:0;border-radius:12px;padding:8px 16px;background:#e4574b;color:#fff;font:700 15px Fredoka,system-ui,sans-serif">Listo</button></div></div>`;
  const area = capa.querySelector('textarea')!;
  area.value = texto;
  document.body.append(capa);
  area.select();
  capa.addEventListener('click', (e) => {
    if (e.target === capa || (e.target as HTMLElement).closest('button')) capa.remove();
  });
}

/** Comparte la invitación (WhatsApp y compañía), o la copia, o la muestra para copiarla. */
export async function invitarAmigos(): Promise<'compartido' | 'copiado' | 'mostrado'> {
  const texto = mensajeInvitacion();
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title: 'Sala de juegos', text: texto });
      return 'compartido';
    } catch (e) {
      // (si cerró el menú de compartir, no se hace nada más)
      if ((e as DOMException)?.name === 'AbortError') return 'compartido';
    }
  }
  try {
    await navigator.clipboard.writeText(texto);
    avisito('Invitación copiada: pégala en WhatsApp 💬');
    return 'copiado';
  } catch {
    mostrar(texto);
    return 'mostrado';
  }
}

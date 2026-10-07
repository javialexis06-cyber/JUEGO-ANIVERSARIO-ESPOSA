// Lo que comparten los juegos que se abren sin la casa (retrete.html y cocina.html): quién juega (el amigo de este
// aparato, con su muñeco y sus colores), dónde se guarda su progreso (en el aparato, nunca en la casa de la pareja),
// a dónde se vuelve al salir (su sala de juegos, ./amigos.html, nunca la casa) y el botón «atrás» de Android.
//
// Estas páginas son de la sala de juegos de amigos: la guardia del <head> manda a la casa (index.html) a quien no
// esté en modo amigo, porque Javier y Laura juegan el retrete y la cocina de verdad desde la casa, con su progreso.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { aspectoDe, perfilAmigo, type PerfilAmigo } from '../salas/perfil';
import type { AspectoJugador } from '../salas/tipos';

export interface AmigoJugando {
  perfil: PerfilAmigo;
  nombre: string;
  aspecto: AspectoJugador;
  /** El muñeco de base (el de Javier o el de Laura): lo usan los modelos, las poses y los recortes. */
  cuerpo: 'el' | 'ella';
}

/** El amigo de este aparato (o null si el aparato no está en modo amigo). */
export function amigoDelAparato(): AmigoJugando | null {
  const p = perfilAmigo();
  if (!p?.activo) return null;
  return { perfil: p, nombre: p.nombre, aspecto: aspectoDe(p), cuerpo: p.cuerpo };
}

/** Lee lo guardado en el aparato (null si no hay o está dañado: cada juego lo normaliza). */
export function leerAparato(clave: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(clave) ?? 'null');
  } catch {
    return null;
  }
}

export function guardarAparato(clave: string, v: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(v));
  } catch {
    /* sin almacenamiento: dura lo que dure la página */
  }
}

/** Vuelve a la sala de juegos de amigos (sin dejar esta página en el historial). */
export function volverALaSala() {
  location.replace(amigoDelAparato() ? './amigos.html' : './index.html');
}

/** Un aviso cortico abajo (para errores de carga y cosas así). */
export function avisoSuelto(texto: string, ms = 3600) {
  const a = document.createElement('div');
  a.className = 'suelto-aviso';
  a.setAttribute('role', 'status');
  a.textContent = texto;
  document.body.append(a);
  setTimeout(() => a.remove(), ms);
}

/**
 * El botón «atrás» de Android (y Esc en el computador): `fn` devuelve true si cerró algo; si no, se vuelve a la sala
 * de juegos. Devuelve cómo dejar de escuchar.
 */
export function alAtras(fn: () => boolean, conEsc = true): () => void {
  const atras = () => {
    if (!fn()) volverALaSala();
  };
  if (Capacitor.isNativePlatform()) {
    const h = App.addListener('backButton', atras);
    return () => void h.then((x) => x.remove());
  }
  if (!conEsc) return () => undefined;
  const tecla = (e: KeyboardEvent) => e.key === 'Escape' && !e.repeat && atras();
  document.addEventListener('keydown', tecla);
  return () => document.removeEventListener('keydown', tecla);
}

/** El primer elemento de la lista de selectores que esté a la vista. */
export function aLaVista(...selectores: string[]): HTMLElement | null {
  for (const sel of selectores) {
    const el = [...document.querySelectorAll<HTMLElement>(sel)].find((b) => b.offsetParent !== null || getComputedStyle(b).position === 'fixed');
    if (el) return el;
  }
  return null;
}

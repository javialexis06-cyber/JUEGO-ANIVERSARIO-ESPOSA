// Los candados del teléfono: PIN (teclado de números), patrón (nueve puntos) y palabra (teclado propio, para que el
// teclado de Android no tape el teléfono en horizontal). Se dibujan dentro de la pantalla del teléfono.
import { efecto } from './audio';
import { ICONO } from './iconos';
import type { Candado } from './tipos';

const plano = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ0-9]/g, '');

export interface OpcionesCandado {
  /** Se abrió (la clave estaba bien). */
  alAbrir: () => void;
  /** Se cerró sin abrir (botón atrás). Si no se da, no hay botón. */
  alCancelar?: () => void;
  /** Cada intento fallido. */
  alFallar?: () => void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/** Arma el candado dentro de `cont` y devuelve el elemento (para quitarlo). */
export function candado(cont: HTMLElement, c: Candado, o: OpcionesCandado): HTMLElement {
  const caja = el('div', `cel-candado cel-candado-${c.tipo}`);
  caja.dataset.candado = c.id;
  const izq = el('div', 'cel-candado-info');
  const titulo = el('div', 'cel-candado-titulo', `${ICONO.candado}<span></span>`);
  titulo.querySelector('span')!.textContent = c.titulo;
  const muestra = el('div', 'cel-candado-muestra');
  const aviso = el('div', 'cel-candado-aviso');
  izq.append(titulo, muestra, aviso);
  if (o.alCancelar) {
    const x = el('button', 'cel-candado-cancelar', `${ICONO.atras}<span>Volver</span>`);
    x.onclick = () => o.alCancelar!();
    izq.append(x);
  }
  const der = el('div', 'cel-candado-entrada');
  caja.append(izq, der);
  cont.append(caja);
  let abriendo = false;

  const fallar = (txt = 'Clave incorrecta') => {
    aviso.textContent = txt;
    caja.classList.remove('temblor');
    void caja.offsetWidth;
    caja.classList.add('temblor');
    efecto('boing', 0.35);
    o.alFallar?.();
  };
  const abrir = () => {
    if (abriendo || !caja.isConnected) return;
    abriendo = true;
    caja.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = true);
    aviso.textContent = '';
    caja.classList.add('abierto');
    titulo.innerHTML = `${ICONO.abierto}<span>Abierto</span>`;
    efecto('tin', 0.5);
    setTimeout(() => { if (caja.isConnected) o.alAbrir(); }, 420);
  };

  if (c.tipo === 'pin') {
    let v = '';
    const n = c.clave.length;
    const pintar = () => { muestra.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < v.length ? 'lleno' : ''}"></i>`).join(''); };
    pintar();
    const teclas = el('div', 'cel-pin');
    for (const t of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'ok']) {
      const b = el('button', `cel-tecla ${t.length > 1 ? 'esp' : ''}`, t === 'borrar' ? ICONO.borrar : t === 'ok' ? ICONO.ok : t);
      b.dataset.tecla = t;
      b.onclick = () => {
        if (t === 'borrar') v = v.slice(0, -1);
        else if (t === 'ok') { if (v.length) { if (v === c.clave) abrir(); else { fallar(); v = ''; } } }
        else if (v.length < n) {
          v += t;
          efecto('tic', 0.18);
          if (v.length === n) { pintar(); if (v === c.clave) abrir(); else setTimeout(() => { fallar(); v = ''; pintar(); }, 160); return; }
        }
        pintar();
      };
      teclas.append(b);
    }
    der.append(teclas);
  } else if (c.tipo === 'patron') {
    muestra.innerHTML = '<span class="cel-candado-tip">Une los puntos sin soltar</span>';
    const zona = el('div', 'cel-patron');
    const lienzo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lienzo.setAttribute('viewBox', '0 0 300 300');
    zona.append(lienzo);
    const puntos: HTMLElement[] = [];
    for (let i = 0; i < 9; i++) {
      const p = el('i', 'cel-punto');
      p.style.left = `${16.67 + (i % 3) * 33.33}%`;
      p.style.top = `${16.67 + Math.floor(i / 3) * 33.33}%`;
      p.dataset.punto = String(i + 1);
      zona.append(p);
      puntos.push(p);
    }
    let camino: number[] = [];
    let arrastrando = false;
    let libre: [number, number] | null = null;
    const centro = (i: number): [number, number] => [50 + (i % 3) * 100, 50 + Math.floor(i / 3) * 100];
    const dibujar = () => {
      const pts = camino.map(centro);
      if (libre && arrastrando) pts.push(libre);
      lienzo.innerHTML = pts.length > 1 ? `<polyline points="${pts.map((p) => p.join(',')).join(' ')}"/>` : '';
      puntos.forEach((p, i) => p.classList.toggle('activo', camino.includes(i)));
    };
    const local = (e: PointerEvent): [number, number] => {
      const r = zona.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * 300, ((e.clientY - r.top) / r.height) * 300];
    };
    const tocar = (x: number, y: number) => {
      for (let i = 0; i < 9; i++) {
        const [cx, cy] = centro(i);
        if (Math.hypot(cx - x, cy - y) < 34 && !camino.includes(i)) {
          // el punto del medio entre dos se toma solo (como en Android)
          const u = camino[camino.length - 1];
          if (u !== undefined) {
            const m = (u + i) / 2;
            if (Number.isInteger(m) && (u % 3) + (i % 3) === 2 * (m % 3) && Math.floor(u / 3) + Math.floor(i / 3) === 2 * Math.floor(m / 3) && !camino.includes(m)) camino.push(m);
          }
          camino.push(i);
          efecto('tic', 0.15);
        }
      }
    };
    zona.onpointerdown = (e) => { arrastrando = true; camino = []; zona.setPointerCapture(e.pointerId); const [x, y] = local(e); tocar(x, y); libre = [x, y]; dibujar(); };
    zona.onpointermove = (e) => { if (!arrastrando) return; const [x, y] = local(e); tocar(x, y); libre = [x, y]; dibujar(); };
    const soltar = () => {
      if (!arrastrando) return;
      arrastrando = false;
      dibujar();
      const v = camino.map((i) => i + 1).join('');
      if (!v) return;
      if (v === c.clave) { zona.classList.add('bien'); abrir(); }
      else { zona.classList.add('mal'); fallar(camino.length < 4 ? 'Une al menos cuatro puntos' : 'Patrón incorrecto'); setTimeout(() => { zona.classList.remove('mal'); camino = []; dibujar(); }, 600); }
    };
    zona.onpointerup = soltar;
    zona.onpointercancel = soltar;
    // Gancho de prueba: dibujar el patrón sin arrastrar
    (zona as HTMLElement & { probar?: (s: string) => void }).probar = (s: string) => { arrastrando = true; camino = [...s].map((d) => Number(d) - 1); soltar(); };
    der.append(zona);
  } else {
    let v = '';
    const caja2 = el('div', 'cel-palabra');
    muestra.append(caja2);
    const pintar = () => { caja2.innerHTML = `${v.replace(/&/g, '&amp;').replace(/</g, '&lt;')}<i></i>`; };
    pintar();
    const teclado = el('div', 'cel-teclado');
    for (const fila of ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm']) {
      const f = el('div', 'cel-fila');
      for (const ch of fila) {
        const b = el('button', 'cel-tecla', ch);
        b.dataset.tecla = ch;
        b.onclick = () => { if (v.length < 14) { v += ch; efecto('tic', 0.12); pintar(); } };
        f.append(b);
      }
      if (fila.startsWith('z')) {
        const bo = el('button', 'cel-tecla esp', ICONO.borrar);
        bo.dataset.tecla = 'borrar';
        bo.onclick = () => { v = v.slice(0, -1); pintar(); };
        const ok = el('button', 'cel-tecla esp ok', 'OK');
        ok.dataset.tecla = 'ok';
        ok.onclick = () => { if (!v) return; if (plano(v) === plano(c.clave)) abrir(); else { fallar('Esa no es'); v = ''; pintar(); } };
        f.append(bo, ok);
      }
      teclado.append(f);
    }
    der.append(teclado);
    // Con teclado físico (computador) también se puede escribir
    const tecla = (e: KeyboardEvent) => {
      if (!caja.isConnected) { document.removeEventListener('keydown', tecla); return; }
      if (abriendo || (e.target instanceof HTMLElement && (e.target.closest('input,textarea') || e.target.isContentEditable))) return;
      if (/^[a-zñáéíóú]$/i.test(e.key) && v.length < 14) { v += plano(e.key) || e.key.toLowerCase(); pintar(); }
      else if (e.key === 'Backspace') { v = v.slice(0, -1); pintar(); }
      else if (e.key === 'Enter') teclado.querySelector<HTMLButtonElement>('[data-tecla="ok"]')!.click();
    };
    document.addEventListener('keydown', tecla);
  }
  return caja;
}

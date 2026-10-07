"""Plano de los 4 tamaños del local de Súper Manía (sin Blender): dibuja cada tamaño con las vitrinas al tope y
revisa que nada se monte encima de nada, que todas las vitrinas tengan camino desde la entrada y la bodega, y que la
fila de cada caja quede libre.

Uso: python3 personajes/blender/revisar_local.py <carpeta de salida>
"""
import math
import os
import sys
from collections import deque

from PIL import Image, ImageDraw

import local_super as LS

ESC = 40  # píxeles por metro


def rect_sitio(sid, t, lvl):
    x, y, rot = LS.posicion(sid, t, lvl)
    kind = LS.TIPO[LS.SITIOS[sid][0]][0]
    h = LS.HUELLA[(kind, lvl)]
    pts = []
    for hx, hy in ((h[0], h[2]), (h[1], h[2]), (h[0], h[3]), (h[1], h[3])):
        c, s = math.cos(rot), math.sin(rot)
        pts.append((x + hx * c - hy * s, y + hx * s + hy * c))
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def acceso(sid, t, lvl):
    x, y, rot = LS.posicion(sid, t, lvl)
    kind = LS.TIPO[LS.SITIOS[sid][0]][0]
    h = LS.HUELLA[(kind, lvl)]
    fy = h[2] - 0.45
    c, s = math.cos(rot), math.sin(rot)
    return x - fy * s, y + fy * c


def revisar(t, salida):
    T = LS.TAMANOS[t]
    W, D, lvl = T['W'], T['D'], T['tope']
    cx, cy = LS.centro(t)
    x0, y0 = LS.IZQ, LS.frente(t)
    img = Image.new('RGB', (int(W * ESC) + 40, int(D * ESC) + 40), '#fdf8f0')
    dr = ImageDraw.Draw(img)
    P = lambda x, y: (20 + (x - x0) * ESC, 20 + (LS.FONDO - y) * ESC)
    dr.rectangle([P(x0, LS.FONDO), P(x0 + W, y0)], outline='#888', width=2)
    problemas = []
    rects = {}
    caja2 = ('caja2', None)
    for sid in LS.sitios_de(t):
        rects[sid] = rect_sitio(sid, t, lvl)
    # la segunda caja (mejora)
    cx2 = LS.caja2_x(t)
    h = LS.HUELLA[('caja', lvl)]
    rects['caja2'] = (cx2 + h[0], LS.caja_y(t) + h[2], cx2 + h[1], LS.caja_y(t) + h[3])
    obst = []
    for q, x, y, r in LS.utileria(t):
        obst.append((q, r))
    pt = LS.puntos(t)
    for k, d in pt['decoracion'].items():
        if d['caja']:
            x, y = d['p']
            obst.append((k, (x - d['caja'], y - d['caja'], x + d['caja'], y + d['caja'])))
    for k in ('caneca', 'caneca2', 'lavadero'):
        x, y = pt[k]
        obst.append((k, (x - 0.3, y - 0.3, x + 0.3, y + 0.3)))
    x, y = pt['canastas']
    obst.append(('canastas', (x - 0.4, y - 0.35, x + 0.4, y + 0.35)))
    # Puerta de la bodega (no se tapa)
    obst_bodega = (LS.BODEGA_X - 0.7, LS.FONDO - 0.6, LS.BODEGA_X + 0.7, LS.FONDO)
    todos = [(f'sitio {k}', r) for k, r in rects.items()] + obst
    for i in range(len(todos)):
        a, ra = todos[i]
        for j in range(i + 1, len(todos)):
            b, rb = todos[j]
            ox = min(ra[2], rb[2]) - max(ra[0], rb[0])
            oy = min(ra[3], rb[3]) - max(ra[1], rb[1])
            if ox > 0.02 and oy > 0.02:
                problemas.append(f'se montan {a} y {b} ({ox:.2f} × {oy:.2f} m)')
        ox = min(ra[2], obst_bodega[2]) - max(ra[0], obst_bodega[0])
        oy = min(ra[3], obst_bodega[3]) - max(ra[1], obst_bodega[1])
        if ox > 0 and oy > 0:
            problemas.append(f'{a} tapa la puerta de la bodega')
        if ra[0] < x0 - 0.01 or ra[2] > x0 + W + 0.01 or ra[1] < y0 - 0.01 or ra[3] > LS.FONDO + 0.01:
            problemas.append(f'{a} se sale del local')
    # Rejilla como la del juego (margen 0.35, casillas de 25 cm, cada mueble con 12 cm de más)
    M, CEL = 0.35, 0.25
    nx, ny = int((W - 2 * M) / CEL), int((D - 2 * M) / CEL)
    gx0, gy0 = x0 + M, y0 + M
    libre = [[True] * ny for _ in range(nx)]
    celda = lambda x, y: (int(math.floor((x - gx0) / CEL)), int(math.floor((y - gy0) / CEL)))
    for _, r in todos:
        i0, j0 = celda(r[0] - 0.12, r[1] - 0.12)
        i1, j1 = celda(r[2] + 0.12, r[3] + 0.12)
        for i in range(max(0, i0), min(nx - 1, i1) + 1):
            for j in range(max(0, j0), min(ny - 1, j1) + 1):
                libre[i][j] = False
    ent = (LS.IZQ + 0.9, LS.entrada_y(t))
    bod = (LS.BODEGA_X, LS.FONDO - 0.9)

    def bfs(p):
        si, sj = celda(*p)
        seen = {(si, sj)} if 0 <= si < nx and 0 <= sj < ny and libre[si][sj] else set()
        q = deque(seen)
        while q:
            i, j = q.popleft()
            for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                a, b = i + di, j + dj
                if 0 <= a < nx and 0 <= b < ny and libre[a][b] and (a, b) not in seen:
                    seen.add((a, b))
                    q.append((a, b))
        return seen

    desde_ent, desde_bod = bfs(ent), bfs(bod)
    if not desde_ent:
        problemas.append('la entrada está tapada')
    if not desde_bod:
        problemas.append('la salida de la bodega está tapada')
    for i in range(nx):
        for j in range(ny):
            if not libre[i][j]:
                x, y = gx0 + i * CEL, gy0 + j * CEL
                dr.rectangle([P(x, y + CEL), P(x + CEL, y)], fill='#eadfd2')
    for sid in LS.sitios_de(t):
        sec = LS.SITIOS[sid][0]
        r = rects[sid]
        dr.rectangle([P(r[0], r[3]), P(r[2], r[1])], fill=LS.TIPO[sec][1], outline='#444')
        dr.text(P(r[0] + 0.05, r[3] - 0.05), f'{sid} {sec[:5]}', fill='#222')
        ax, ay = acceso(sid, t, lvl)
        i, j = celda(ax, ay)
        # el juego camina a la casilla libre más cercana: se acepta si alguna vecina (≤ 2 casillas) está conectada
        ok = any((i + di, j + dj) in desde_ent and (i + di, j + dj) in desde_bod for di in range(-2, 3) for dj in range(-2, 3))
        dr.ellipse([P(ax - 0.1, ay + 0.1), P(ax + 0.1, ay - 0.1)], fill='#2a2' if ok else '#d22')
        if not ok:
            problemas.append(f'sitio {sid} ({sec}) sin camino')
    r = rects['caja2']
    dr.rectangle([P(r[0], r[3]), P(r[2], r[1])], outline='#999', width=2)
    for q, r in obst:
        dr.rectangle([P(r[0], r[3]), P(r[2], r[1])], fill='#c9b8a6', outline='#777')
        dr.text(P(r[0], r[3]), q[:6], fill='#333')
    # Filas de las cajas: 8 puestos al frente de cada caja
    hy = LS.HUELLA[('caja', lvl)][2]
    for cxx in (LS.caja_x(t), cx2):
        for k in range(8):
            fx, fy = cxx + 0.2 + k * 0.62, LS.caja_y(t) + hy - 0.5
            i, j = celda(fx, fy)
            ok = 0 <= i < nx and 0 <= j < ny and libre[i][j]
            dr.ellipse([P(fx - 0.12, fy + 0.12), P(fx + 0.12, fy - 0.12)], outline='#36c' if ok else '#d22', width=2)
            if not ok and cxx == LS.caja_x(t) and k < 6:
                problemas.append(f'la fila de la caja choca en el puesto {k}')
    for p, c in ((ent, '#36c'), (bod, '#c63')):
        dr.ellipse([P(p[0] - 0.2, p[1] + 0.2), P(p[0] + 0.2, p[1] - 0.2)], fill=c)
    img.save(os.path.join(salida, f'local_{t}.png'))
    return problemas


if __name__ == '__main__':
    salida = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(salida, exist_ok=True)
    total = 0
    for t in LS.TAMANOS:
        pr = revisar(t, salida)
        total += len(pr)
        print(f"Tamaño {t} · {LS.TAMANOS[t]['nombre']}: {len(LS.sitios_de(t))} sitios", '· sin problemas' if not pr else '')
        for p in pr:
            print('  -', p)
    sys.exit(1 if total else 0)

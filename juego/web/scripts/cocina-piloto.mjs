// Piloto compartido: solo acciones de estaciones y reloj normal del motor.
export const cocinarDia = (p, receta) => p.evaluate((id) => {
      const m = window.__cocinaMotor, defs = m.receta.pruebas;
      // El reloj sigue por el motor; dibujar cada décima de segundo simulada vuelve lenta la prueba sin GPU.
      const dibujar = m.dibujar.bind(m);
      m.dibujar = () => {};
      const avanzar = (s) => m.probar('avanzar', s);
      const hasta = (fn, max = 180) => {
        for (let i = 0; i < max * 10 && !fn(); i++) avanzar(0.1);
        if (!fn()) throw Error(`Se trabó ${id}: ${JSON.stringify(m.resumen())}`);
      };
      const punto = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
      const tocar = (tipo, q) => m.tocar(tipo, q.x, q.y);
      const click = (r) => { const q = punto(r); tocar('bajar', q); tocar('subir', q); };
      const mantener = (r, fn) => { const q = punto(r); tocar('bajar', q); hasta(fn, 20); tocar('subir', q); };
      const ir = (i) => { m.irA(i); avanzar(0.4); };
      const decorar = (e, pd, o) => {
        for (const t of pd.toppings) {
          const d = defs.TOP[t.id];
          click(e.botones().find((b) => b.id === t.id));
          const uv = (u, v) => ({ x: o.x + o.rx * u, y: o.y + o.ry * v });
          if (d.tipo === 'pieza') {
            const n = t.n ?? 1;
            const ps = n === 1 ? [[0, 0]] : n === 2 ? [[-0.45, 0], [0.45, 0]] : Array.from({ length: n }, (_, i) => [Math.cos(-Math.PI / 2 + i / n * 2 * Math.PI) * 0.55, Math.sin(-Math.PI / 2 + i / n * 2 * Math.PI) * 0.55]);
            for (const [u, v] of ps) { tocar('bajar', uv(u, v)); tocar('subir', uv(u, v)); }
          } else {
            // Recorrer la superficie con la salsa o el salero, sin escribir directamente la obra.
            for (let v = -0.7; v <= 0.71; v += 0.25) {
              const q = uv(-0.65, v); tocar('bajar', q);
              for (let u = -0.6; u <= 0.61; u += 0.08) { tocar('mover', uv(u, v)); avanzar(0.04); }
              tocar('subir', uv(0.65, v));
            }
          }
        }
      };
      const pedidos = [];
      while (m.s.fase !== 'fin') {
        hasta(() => m.s.invitados.some((e) => e.estado === 'fila') || m.s.fase === 'fin');
        if (m.s.fase === 'fin') break;
        ir(0);
        m.tomarPedido(m.yo.id);
        hasta(() => !m.s.invitados.some((e) => e.estado === 'pidiendo'));
        const tk = m.s.tickets[m.s.tickets.length - 1];
        if (!tk) throw Error('No salió el tiquete');
        m.activo = tk;
        const pd = tk.pedido;
        pedidos.push(structuredClone(pd));
        if (pedidos.length > m.s.invitados.length) throw Error('Se repitió un pedido sin avanzar el día');
        ir(1);
        const a = m.estaciones[0];
        if (id === 'wafles') {
          if (a.c.jarra !== pd.masa) click(a.jarras().find((r) => r.id === pd.masa));
          for (let i = 0; i < pd.n; i++) {
            const r = a.planchaRect(0).caja, plancha = a.c.planchas[0], meta = defs.PUNTOS[pd.punto];
            click(r); hasta(() => plancha.fase === 'cocinando'); hasta(() => plancha.a >= meta);
            click(r); hasta(() => plancha.fase === 'cocinando'); hasta(() => plancha.b >= meta);
            click(r); avanzar(0.6);
          }
          ir(2);
          const b = m.estaciones[1];
          for (let i = 0; i < pd.n; i++) click(defs.rectsRejilla(m, 320)[0]);
          if (tk.obra.wafles.length !== pd.n) throw Error('No se pudieron poner los wafles en el plato');
          decorar(b, pd, defs.superficieDe(defs.ovaloPlato(m), tk.obra.wafles.length));
          click(b.rEntregar());
        } else if (id === 'fresas') {
          click(a.rVasos().find((r) => r.tam === pd.vaso));
          for (let i = 0; i < defs.VASOS[pd.vaso].fresas; i++) {
            click(a.rCanasta());
            const q = a.tablaPos();
            for (const l of defs.CORTES[pd.corte].lineas) {
              const cx = q.x + Math.sin(l.a) * l.d * q.r, cy = q.y - Math.cos(l.a) * l.d * q.r;
              const x = Math.cos(l.a) * q.r * 1.1, y = Math.sin(l.a) * q.r * 1.1;
              tocar('bajar', { x: cx - x, y: cy - y }); tocar('mover', { x: cx + x, y: cy + y }); tocar('subir', { x: cx + x, y: cy + y });
            }
            click(a.rAlVaso());
          }
          ir(2);
          const b = m.estaciones[1];
          click(b.rTazon(0).caja);
          mantener(b.herramientas().find((r) => r.id === 'crema'), () => tk.obra.tazon.nivel >= 0.8);
          for (let i = 0; i < pd.dulce; i++) click(b.herramientas().find((r) => r.id === 'condensada'));
          if (pd.sabor) click(b.herramientas().find((r) => r.id === pd.sabor));
          click(b.rTazon(0).boton); hasta(() => tk.obra.tazon.textura >= defs.PUNTO_CREMA[pd.punto]); click(b.rTazon(0).boton);
          ir(3);
          const c = m.estaciones[2];
          mantener(c.rCrema(), () => tk.obra.crema >= 0.9);
          decorar(c, pd, c.superficie()); click(c.rEntregar());
        } else {
          click(a.rVasos().find((r) => r.tam === pd.vaso));
          for (let i = 0; i < defs.VASOS[pd.vaso].bombas; i++) click(a.rBombas().find((r) => r.id === pd.base));
          for (let i = 0; i < pd.hielo; i++) click(a.rHielo());
          mantener(a.rLeche(), () => tk.obra.vaso.leche >= 0.85);
          ir(2);
          const b = m.estaciones[1], r = b.rLicuadora(0);
          click(r.caja); click(r.boton);
          hasta(() => b.licuadoras[0]?.valor >= defs.LICUADO[pd.licuado]);
          click(r.boton); click(r.servir);
          ir(3);
          const c = m.estaciones[2];
          if (pd.crema !== 'sin') mantener(c.rCrema(), () => tk.obra.crema >= defs.CREMA[pd.crema]);
          decorar(c, pd, c.superficie()); click(c.rPitillos()[0]); click(c.rEntregar());
        }
        hasta(() => m.s.fase !== 'juicio', 30);
        avanzar(2);
      }
      m.dibujar = dibujar;
      dibujar();
      return { resultado: m.s.resultado, progreso: structuredClone(m.progreso), pedidos };
    }, receta);

// Los íconos de la interfaz salen de los mismos atlas del juego (los modelos de Blender renderizados): las armas,
// las pasivas, las cosas del piso y los mugrosos (para la colección).

interface AtlasJson {
  ancho: number;
  alto: number;
}

let objetos: (AtlasJson & { objetos: Record<string, [number, number, number, number]> }) | null = null;
let bichos: (AtlasJson & { bichos: Record<string, { cuadros: [number, number, number, number][] }> }) | null = null;

export async function cargarIconos() {
  if (objetos && bichos) return;
  const [o, b] = await Promise.all([
    fetch('./lavado/objetos.json').then((r) => r.json()).catch(() => null),
    fetch('./lavado/bichos.json').then((r) => r.json()).catch(() => null),
  ]);
  objetos = o;
  bichos = b;
}

/** Un ícono como <i> con su recorte del atlas (tam en px). */
export function icono(nombre: string, tam = 40, clase = ''): string {
  const r = objetos?.objetos[nombre];
  if (!objetos || !r) return `<i class="lv-ico ${clase}" style="--t:${tam}px"></i>`;
  const k = tam / r[2];
  return `<i class="lv-ico ${clase}" style="--t:${tam}px;--img:url(./lavado/objetos.webp);--bs:${objetos.ancho * k}px ${objetos.alto * k}px;--bp:-${r[0] * k}px -${r[1] * k}px"></i>`;
}

/** Un mugroso (su cuadro normal) para el bestiario. */
export function iconoBicho(id: string, tam = 48, clase = ''): string {
  const d = bichos?.bichos[id];
  if (!bichos || !d) return `<i class="lv-ico ${clase}" style="--t:${tam}px"></i>`;
  const [x, y, w] = d.cuadros[0];
  const k = tam / w;
  return `<i class="lv-ico ${clase}" style="--t:${tam}px;--img:url(./lavado/bichos.webp);--bs:${bichos.ancho * k}px ${bichos.alto * k}px;--bp:-${x * k}px -${y * k}px"></i>`;
}

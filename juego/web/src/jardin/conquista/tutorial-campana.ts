/** Tutorial de la campaña (30 de octubre de 2026): Dave explica cada mecánica la primera vez que aparece y la
 * guía completa queda en el botón de ayuda. Lo visto se recuerda por perfil, aparte del guardado de la historia. */
export interface TemaTutorial { titulo: string; texto: string[] }
export const TUTORIAL: Record<string, TemaTutorial> = {
    mapa: { titulo: 'El mapa de la campaña', texto: [
        'Cada parcela del mapa es un área. Las verdes son nuestras y las moradas, de los zombis. Las de borde dorado se pueden recuperar ya: tocan una zona nuestra y tienen ruta hasta la casa.',
        'Toca un área dorada para ver su ficha, preparar su formación y lanzar una expedición. Con los botones de arriba subes al país y al mundo: doce países, cuatro ciudades por país y cinco áreas por ciudad.'] },
    monedas: { titulo: 'Monedas y tienda', texto: [
        'Recuperar un área por primera vez paga monedas. Pagan más los depósitos, las fortalezas y los países lejanos. Resistir un asedio paga un poco.',
        'En la tienda (arriba a la derecha) compras las plantas que quieras. Las de cada país salen a la venta cuando llegas a él, y lo que compras es tuyo para siempre.'] },
    formacion: { titulo: 'La formación de cada área', texto: [
        'Cada área admite un número de semillas: su cupo. Empieza en cuatro y llega a ocho en los últimos países. Las fortalezas, las zonas con agua y los tableros de seis o siete carriles admiten una más.',
        'Cada tipo de planta defiende una sola zona a la vez. Si lo llevas a otra, sus plantas se retiran de la anterior y no te devuelven los soles.'] },
    asedio: { titulo: '¡Un asedio!', texto: [
        'Las zonas nuestras que tocan territorio zombi (frontera ⚔️) reciben ataques. Toca las espadas de abajo a la derecha para ir a defenderla. Los demás frentes siguen corriendo.',
        'Cada asedio resistido hace más fuerte el siguiente (hasta 6) y paga unas monedas. Si pierdes la zona, vuelve a ser de los zombis.'] },
    despejada: { titulo: 'Zona despejada', texto: [
        'Cuando todas las vecinas de una zona son nuestras, queda despejada 🛡️ y ya no la atacan. Avanzar en bloque protege la retaguardia.'] },
    simultaneos: { titulo: 'Varios frentes a la vez', texto: [
        'Hay más de un combate abierto y todos corren al mismo tiempo, aunque no los estés mirando. Cambia de frente con los botones de espadas. La pausa los detiene todos.'] },
    descanso: { titulo: 'Punto de descanso', texto: [
        'Al ganar, la zona conserva las plantas, su vida, los soles y los cortacéspedes que quedaron. Si cierras en plena batalla, ese combate se repite desde el inicio.'] },
    fortaleza: { titulo: 'Fortalezas', texto: [
        'Cada ciudad termina en una fortaleza 🔒. Se abre al recuperar las otras cuatro áreas de la ciudad y trae gargantúas. Recuperarla abre el camino a la siguiente ciudad o país.',
        'El castillo del Dr. Zomboid, en Umbra, se abre solo cuando recuperas las otras 239 áreas.'] },
    pais: { titulo: 'Un país nuevo', texto: [
        'Llegaste a {pais}. Sus zombis son distintos y la tienda ya vende sus plantas: revisa qué te conviene antes de atacar.'] },
    agua: { titulo: 'Carriles de agua', texto: [
        'Esta área tiene agua. En el agua solo se siembran directo las plantas acuáticas; para las demás pon primero un nenúfar. Estas áreas admiten una semilla más.'] },
    noche: { titulo: 'Combate de noche', texto: [
        'De noche no caen soles del cielo: empiezas con 100 soles y llegan menos zombis. Lleva una planta de sol barata (la seta solar cuesta 25) y cuidado con las lápidas.'] },
    fusion: { titulo: 'Fusiones', texto: [
        'El laboratorio de Forjaria te enseñó fusiones: siembra una planta encima de otra para combinarlas. Las recetas están en el Almanaque.'] },
    ruta: { titulo: 'Ruta de suministro', texto: [
        'Una zona solo recibe formación nueva si hay un camino de zonas nuestras hasta la casa. Si se corta, recupera las zonas del medio.'] },
};
/** Orden de la guía completa (botón de ayuda). */
export const GUIA = ['mapa', 'formacion', 'monedas', 'asedio', 'despejada', 'simultaneos', 'descanso', 'fortaleza', 'pais', 'agua', 'noche', 'fusion', 'ruta'];

export class MemoriaTutorial {
    private vistos: Set<string>;
    constructor(private almacen: Pick<Storage, 'getItem' | 'setItem'>, private clave: string) {
        let v: unknown = [];
        try { v = JSON.parse(almacen.getItem(clave) ?? '[]'); } catch { v = []; }
        this.vistos = new Set(Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
    }
    visto(tema: string) { return this.vistos.has(tema); }
    marcar(tema: string) { this.vistos.add(tema); try { this.almacen.setItem(this.clave, JSON.stringify([...this.vistos])); } catch { /* sin almacenamiento: se vuelve a mostrar */ } }
}

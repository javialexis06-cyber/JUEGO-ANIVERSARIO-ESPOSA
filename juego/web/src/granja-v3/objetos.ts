import {ACCESOS_CAMPANA} from './accesos-campana';
import {ARTEFACTOS_COMUNIDAD} from './comunidad-datos';
import {TERRITORIOS_REGIONALES} from './regiones-datos';
import {PREMIOS_NARRATIVOS} from './premios-datos';
import { DATOS as RECURSOS_ASTRA } from './astra-recursos-datos';
import { leerHuevo } from './ganaderia';
import { FRUTALES } from './frutales-datos';
import { ARTICULOS, CULTIVOS, ESPECIES, PECES, PRECIOS_VENTA } from './catalogo';
import { RECETAS_CORRESPONDENCIA } from './correspondencia-datos';
import { RECETAS_LIBROS } from './libros-datos';
import { ACCESORIOS_COMPANIA } from './equipo-compania-datos';

/** Un único vocabulario de objetos para mochila, cofres, cocina, equipo y botín. */
export type RarezaObjeto='comun'|'inusual'|'raro'|'epico'|'legendario';
export type EstacionProduccion='mano'|'banco_trabajo'|'horno'|'fundidora'|'prensa'|'molino_artesanal'|'cocina'|'fermentador'|'telar'|'recicladora'|'forja'|'alto_horno'|'trituradora'|'taladro_vapor'|'ensambladora'|'recuperadora';
export type TipoBuff='ataque'|'defensa'|'velocidad'|'pesca'|'mineria'|'suerte';
export interface BuffObjeto {tipo:TipoBuff;valor:number;duracionMs:number}
export interface DefObjeto {
 id:string;nombre:string;categoria:'recurso'|'mineral'|'lingote'|'comida'|'semilla'|'pez'|'producto'|'herramienta'|'equipo'|'maquina'|'contenedor'|'estructura'|'insumo';
 rareza:RarezaObjeto;precioCompra:number;precioVenta:number;pilaMax:number;descripcion:string;
 comida?:{energia:number;vida:number;buffs?:BuffObjeto[]};
 equipo?:{ranura:'arma'|'casco'|'pechera'|'botas';ataque?:number;defensa?:number;critico?:number;velocidad?:number};
 herramienta?:{tipo:string;nivel:number};maquina?:{estacion:EstacionProduccion};contenedor?:{casillas:number};
 aspersor?:{radio:number;cruz?:boolean};recuperadora?:{nivel:number};
}
export interface RecetaProduccion {premioNarrativo?:string;baseNarrativa?:string;id:string;nombre:string;estacion:EstacionProduccion;ingredientes:Record<string,number>;salida:{articulo:string;cantidad:number};duracionMs:number;nivel:number;requisito?:string}
export const OBJETOS:Record<string,DefObjeto>=Object.create(null);
function objeto(id:string,nombre:string,categoria:DefObjeto['categoria'],precioVenta:number,extra:Partial<DefObjeto>={}){
 OBJETOS[id]={id,nombre,categoria,rareza:'comun',precioCompra:Math.max(1,precioVenta*3),precioVenta,pilaMax:999,descripcion:nombre,...extra};
}
for(const [id,nombre,descripcion]of ARTEFACTOS_COMUNIDAD)objeto(id,nombre,'recurso',0,{precioCompra:0,descripcion});
for(const [id,nombre,descripcion]of [['trampa_cebo','Trampa de cebo','Cuatro cebos, un intento por noche y salida que bloquea nuevos intentos.'],['terminal_carga','Terminal de carga','Se instala en un archivo con el acuerdo de Celia.'],['exportador_envios','Exportador de envíos','Autoriza un solo producto y límite nocturno en un cofre cercano a la caja.']] as const)objeto(id,nombre,'insumo',0,{precioCompra:0,descripcion});
objeto('conector_produccion','Conector de producción','estructura',0,{precioCompra:0,pilaMax:20,descripcion:'Un metro de conexión física; une dispositivos contiguos de la misma zona.'});
for(const d of ACCESOS_CAMPANA)objeto(d.id,d.nombre,'estructura',0,{precioCompra:0,pilaMax:1,descripcion:'Enlace civil autorizado por '+d.permiso+'. Las expediciones de combate conservan sus dispositivos originales.'});
objeto('alimento_mascota','Alimento para mascotas','insumo',4,{precioCompra:20,descripcion:'Una ración equilibrada para gatos, perros y tortugas.'});
for(const a of ACCESORIOS_COMPANIA)objeto(a.id,a.nombre,'equipo',0,{precioCompra:0,pilaMax:1,descripcion:a.descripcion+' Se fabrica en el taller y se equipa desde Compañeros, junto al animal.'});
for(const [id,nombre,precio] of [
 ['madera','Madera',2],['piedra','Piedra',2],['fibra','Fibra vegetal',2],['heno','Heno',1],['madera_ancestral','Madera ancestral',30],
 ['cristal','Cristal de Celia',20],['arcilla','Arcilla',4],['arena','Arena',2],['resina','Resina de árbol',15],['cuero','Cuero curtido',18],
 ['sal','Sal mineral',6],['azucar','Azúcar',10],['harina','Harina de trigo',20],['aceite','Aceite vegetal',25],['tela','Tela tejida',45],
 ['cuerda','Cuerda de fibra',10],['vidrio','Vidrio',18],['bateria','Batería de cuarzo',90],['engranaje','Engranaje de hierro',65],
 ['circuito_astral','Circuito astral',300],['combustible_estelar','Combustible estelar',160],['grano_cafe','Grano de café',12],['manzana','Manzana',12],
 ] as [string,string,number][])objeto(id,nombre,'recurso',precio);
for(const [id,nombre,precio,rareza] of [
 ['carbon','Carbón',5,'comun'],['cobre','Mineral de cobre',7,'comun'],['hierro','Mineral de hierro',12,'comun'],['oro','Mineral de oro',28,'inusual'],
 ['cuarzo','Cuarzo',18,'comun'],['rubi','Rubí',85,'raro'],['jade','Jade',65,'raro'],['obsidiana','Obsidiana',50,'raro'],
 ['plata','Mineral de plata',22,'inusual'],['titanio','Mineral de titanio',60,'epico'],['meteorita','Meteorita',110,'epico'],['cristal_astral','Cristal astral',180,'legendario'],
 // Minas de Celia (estilo Stardew): estaño para el bronce, mitrilo de la caverna, gemas y geodas para la trituradora
 ['estano','Mineral de estaño',9,'comun'],['mitrilo','Mineral de mitrilo',140,'epico'],['amatista','Amatista',45,'inusual'],['topacio','Topacio',55,'inusual'],
 ['aguamarina','Aguamarina',75,'raro'],['esmeralda','Esmeralda',120,'raro'],['diamante','Diamante',300,'epico'],
 ['geoda','Geoda',20,'comun'],['geoda_helada','Geoda helada',35,'inusual'],['geoda_magma','Geoda de magma',50,'raro'],['geoda_omni','Geoda omni',120,'epico'],
 ] as [string,string,number,RarezaObjeto][])objeto(id,nombre,'mineral',precio,{rareza});
for(const [id,nombre,precio,rareza] of [
 ['cobre','Cobre',45,'comun'],['hierro','Hierro',75,'comun'],['oro','Oro',170,'inusual'],['plata','Plata',135,'inusual'],
 ['titanio','Titanio',365,'epico'],['meteorita','Meteorita',660,'epico'],['acero','Acero',165,'raro'],['astral','Aleación astral',1150,'legendario'],
 ['bronce','Bronce',95,'comun'],['mitrilo','Mitrilo',900,'epico'],
 ] as [string,string,number,RarezaObjeto][])objeto(`lingote_${id}`,`Lingote de ${nombre.toLowerCase()}`,'lingote',precio,{rareza});
for(const c of CULTIVOS){if(!OBJETOS[c.producto])objeto(c.producto,c.nombre,'producto',c.valor);objeto(c.semilla,`Semillas de ${c.nombre.toLowerCase()}`,'semilla',Math.max(1,Math.floor(c.precio/2)),{precioCompra:c.precio});}
for(const p of PECES)objeto(p.id,p.nombre,'pez',p.valor,{rareza:p.rareza>=5?'epico':p.rareza>=3?'raro':'comun'});
for(const d of Object.values(ESPECIES))objeto(d.producto,d.producto.replaceAll('_',' '),'producto',PRECIOS_VENTA[d.producto]||15);
for(const a of ARTICULOS)if(!OBJETOS[a.id])objeto(a.id,a.nombre,a.categoria==='insumo'?'insumo':'estructura',Math.floor(a.precio/3),{precioCompra:a.precio});
for(const f of FRUTALES){objeto(f.planton,'Plantón de '+f.nombre.toLowerCase(),'semilla',Math.floor(f.precio/2),{precioCompra:f.precio,descripcion:'Frutal productivo: crece al dormir con riego; necesita un espacio de 3 × 3.'});if(!OBJETOS[f.producto])objeto(f.producto,f.producto[0].toUpperCase()+f.producto.slice(1),'producto',f.valor);}
const minuto=60_000;
const comidas:[string,string,number,number,number,BuffObjeto[]?][]=[
 ['pan','Pan recién horneado',42,32,10],['tortilla','Tortilla de huevo',52,45,18],['sopa_verduras','Sopa de verduras',78,65,28],
 ['ensalada','Ensalada de la huerta',55,40,20,[{tipo:'velocidad',valor:.12,duracionMs:3*minuto}]],
 ['trucha_asada','Trucha asada',85,65,40,[{tipo:'pesca',valor:1,duracionMs:5*minuto}]],
 ['pastel_calabaza','Pastel de calabaza',150,100,50,[{tipo:'defensa',valor:3,duracionMs:5*minuto}]],
 ['mermelada_fresa','Mermelada de fresa',80,45,15],['guiso_minero','Guiso del minero',135,95,65,[{tipo:'mineria',valor:2,duracionMs:6*minuto}]],
 ['cafe','Café de viaje',60,35,0,[{tipo:'velocidad',valor:.25,duracionMs:3*minuto}]],
 ['elixir_astral','Elixir astral',420,100,100,[{tipo:'ataque',valor:8,duracionMs:4*minuto},{tipo:'suerte',valor:2,duracionMs:4*minuto}]],
 ['queso','Queso artesanal',55,45,20],['mayonesa','Mayonesa casera',35,25,8],['jugo_manzana','Jugo de manzana',60,40,12],
 ['estofado_lunar','Estofado lunar',230,100,75,[{tipo:'defensa',valor:6,duracionMs:6*minuto}]],
 ['galleta_escarcha','Galleta de escarcha',140,70,35,[{tipo:'suerte',valor:1,duracionMs:5*minuto}]],
 ['pescado_empanado','Pescado empanado',80,60,25],['racion_viajera','Ración viajera',95,75,35],
 ];
for(const [id,nombre,precio,energia,vida,buffs] of comidas)objeto(id,nombre,'comida',precio,{pilaMax:99,comida:{energia,vida,...(buffs?{buffs}:{})}});
for(const [tipo,nombre] of [['hacha','Hacha'],['pico','Pico'],['azada','Azada'],['regadera','Regadera'],['guadana','Guadaña'],['cana','Caña'],['espada','Espada']] as const){
 objeto(`herramienta_${tipo}`,nombre,'herramienta',0,{pilaMax:1,herramienta:{tipo,nivel:0},descripcion:`Herramienta permanente: ${nombre.toLowerCase()}.`});
}
const metales:[string,string,number,number,number,RarezaObjeto][]=[['cobre','cobre',7,2,100,'comun'],['bronce','bronce',10,3,160,'comun'],['hierro','hierro',12,4,220,'inusual'],['oro','oro',14,3,390,'raro'],['obsidiana','obsidiana',21,6,600,'raro'],['titanio','titanio',29,9,1100,'epico'],['mitrilo','mitrilo',34,11,1600,'epico'],['astral','aleación astral',40,13,2400,'legendario']];
for(const [metal,nombre,ataque,defensa,precio,rareza] of metales){
 objeto(`espada_${metal}`,`Espada de ${nombre}`,'equipo',precio,{pilaMax:1,rareza,equipo:{ranura:'arma',ataque,critico:metal==='oro'?.16:metal==='astral'?.12:.05}});
 for(const [pieza,etiqueta,factor] of [['casco','Casco',.6],['pechera','Pechera',1],['botas','Botas',.5]] as const)
  objeto(`${pieza}_${metal}`,`${etiqueta} de ${nombre}`,'equipo',Math.round(precio*factor),{pilaMax:1,rareza,equipo:{ranura:pieza,defensa:Math.max(1,Math.round(defensa*factor)),...(pieza==='botas'?{velocidad:metal==='astral'?.15:metal==='titanio'?.1:0}:{})}});
}
for(const [id,nombre,casillas,precio] of [['cofre_madera','Cofre de madera',24,70],['cofre_hierro','Cofre de hierro',48,260]] as const)objeto(id,nombre,'contenedor',precio,{pilaMax:20,contenedor:{casillas}});
// Progresión de armas: no crea niveles de personaje ni de armadura.
for(const [id,nombre] of [['arco_ribera','Arco de ribera'],['baston_cuarzo','Bastón de cuarzo'],['sello_fuego','Sello de fuego'],['sello_agua','Sello de agua'],['sello_tierra','Sello de tierra'],['sello_aire','Sello de aire']] as const)
 objeto(id,nombre,'equipo',40,{pilaMax:1,equipo:{ranura:'arma'},descripcion:'Arma de expedición. Su dominio crece con impactos efectivos; se selecciona en la barra o se equipa en la ranura de arma.'});
objeto('flecha_ribera','Flecha de ribera','insumo',0,{pilaMax:99,descripcion:'Munición del arco; cada disparo confirmado consume una flecha.'});
for(const [id,nombre,precio] of [
 ['horno','Horno de piedra',100],['fundidora','Fundidora avanzada',440],['prensa','Prensa artesanal',140],['molino_artesanal','Molino de mesa',170],
 ['cocina','Cocina de campo',160],['fermentador','Fermentador de roble',180],['telar','Telar',190],['recicladora','Recicladora',210],
 ['banco_trabajo','Banco de trabajo',90],['forja','Forja de equipo',300],
 ] as [EstacionProduccion,string,number][])objeto(id,nombre,'maquina',precio,{pilaMax:20,maquina:{estacion:id},descripcion:`Colócala junto a un cofre para automatizar sus recetas.`});
// Revolución industrial: máquinas de vapor que trabajan solas entre cofres (entra por un cofre, sale por otro)
for(const [id,nombre,precio,descripcion] of [
 ['alto_horno','Alto horno',900,'Funde por tandas: más lingotes por mineral y más rápido que el horno. Junto a un cofre trabaja sola.'],
 ['trituradora','Trituradora de vapor',650,'Parte geodas y saca sus gemas; también muele piedra en arena.'],
 ['taladro_vapor','Taladro de vapor',1400,'Saca mineral del suelo de la granja con carbón, sin bajar a la mina.'],
 ['ensambladora','Ensambladora',1200,'Arma engranajes, baterías y circuitos en serie.'],
 ] as [EstacionProduccion,string,number,string][])objeto(id,nombre,'maquina',precio,{pilaMax:20,rareza:'raro',maquina:{estacion:id},descripcion});
for(const [id,nombre,nivel,precio,rareza] of [['recuperadora_cobre','Recuperadora de cobre',1,300,'inusual'],['recuperadora_hierro','Recuperadora de hierro',2,900,'raro'],['recuperadora_astral','Recuperadora astral',3,2600,'epico']] as [string,string,number,number,RarezaObjeto][])
 objeto(id,nombre,'maquina',precio,{pilaMax:5,rareza,maquina:{estacion:'recuperadora'},recuperadora:{nivel},descripcion:`Mete lo que fabriques o consigas y devuelve el ${[0,40,60,80][nivel]} % de sus materiales (más si tiene calidad).`});
objeto('aspersor_basico','Aspersor básico','estructura',45,{pilaMax:20,aspersor:{radio:1,cruz:true},descripcion:'Riega cada mañana las 4 casillas de al lado (arriba, abajo y a los lados).'});
objeto('aspersor_cobre','Aspersor de cobre','estructura',100,{pilaMax:20,aspersor:{radio:1}});
objeto('aspersor_hierro','Aspersor de hierro','estructura',280,{pilaMax:20,aspersor:{radio:2}});
objeto('aspersor_astral','Aspersor astral','estructura',850,{pilaMax:20,rareza:'epico',aspersor:{radio:3}});
for(const [id,nombre,precio] of [['portal_verdia','Portal de Verdía',1100],['portal_senda','Portal de Senda',1800],['portal_nox','Portal de Nox',2500],['nave_exploradora','Nave exploradora',8500]] as const)objeto(id,nombre,'estructura',precio,{pilaMax:1,rareza:id==='nave_exploradora'?'legendario':'epico'});
objeto('antorcha','Antorcha de exploración','insumo',8,{pilaMax:99});
objeto('fertilizante','Abono artesanal','insumo',12,{pilaMax:999});
objeto('cebo_refinado','Cebo refinado','insumo',10,{pilaMax:999});
objeto('semilla_cafe','Semilla de café','semilla',20);

export const RECETAS:RecetaProduccion[]=[];
function receta(id:string,estacion:EstacionProduccion,ingredientes:Record<string,number>,duracionSegundos:number,nivel=0,cantidad=1,requisito?:string){
 RECETAS.push({id,nombre:OBJETOS[id]?.nombre||id,estacion,ingredientes,salida:{articulo:id,cantidad},duracionMs:duracionSegundos*1000,nivel,...(requisito?{requisito}:{})});
}
// El combustible se consume al iniciar cada lote, junto con sus minerales.
receta('collar_paseo','mano',{fibra:8,cobre:1},0);
receta('brida_senda','banco_trabajo',{cuerda:3,fibra:6,lingote_cobre:1},25);
receta('herraduras_senda','banco_trabajo',{lingote_hierro:2,piedra:4},30);
receta('carbon','horno',{madera:8},25,0,2);
receta('lingote_cobre','horno',{cobre:5,carbon:1},30);
receta('lingote_hierro','horno',{hierro:5,carbon:1},45,1);
receta('lingote_plata','horno',{plata:5,carbon:1},55,1);
receta('lingote_oro','horno',{oro:5,carbon:2},70,2);
receta('lingote_acero','fundidora',{lingote_hierro:2,carbon:3},100,2);
receta('lingote_titanio','fundidora',{titanio:5,carbon:3},120,3);
receta('lingote_meteorita','fundidora',{meteorita:5,carbon:4},150,3);
receta('lingote_astral','fundidora',{lingote_meteorita:2,cristal_astral:2,polvo_estelar:3},200,4);
receta('vidrio','horno',{cuarzo:3},35,0,2);
receta('harina','molino_artesanal',{trigo:3},20,0,2);
receta('azucar','molino_artesanal',{maiz:3},25,0,2);
receta('aceite','prensa',{maiz:4},40);
receta('queso','prensa',{leche:2},60);
receta('mayonesa','prensa',{huevo:2,aceite:1},45);
receta('tela','telar',{lana:3},55,0,2);
receta('cuerda','mano',{fibra:5},0,0,2);
receta('cuero','telar',{fibra_suave:3,resina:1},70,1,2);
receta('resina','prensa',{madera:10,fibra:2},40);
receta('sal','recicladora',{piedra:4},30,0,2);
receta('pan','cocina',{harina:2},20);
receta('tortilla','cocina',{huevo:2,leche:1},25);
receta('sopa_verduras','cocina',{zanahoria:2,tomate:1,sal:1},35);
receta('ensalada','cocina',{tomate:2,zanahoria:1,aceite:1},20);
receta('trucha_asada','cocina',{trucha:1,sal:1},30);
receta('pastel_calabaza','cocina',{calabaza:1,harina:2,huevo:1,azucar:1},50,1);
receta('mermelada_fresa','fermentador',{fresa:3,azucar:1},90);
receta('guiso_minero','cocina',{zanahoria:2,leche:1,trufa:1},45,1);
receta('cafe','cocina',{grano_cafe:3},20);
receta('elixir_astral','fermentador',{cristal_astral:1,fresa_escarcha:2,polvo_estelar:1},120,3);
receta('jugo_manzana','prensa',{manzana:3},30);
receta('estofado_lunar','cocina',{calabaza_lunar:1,trufa:2,queso:1},55,2);
receta('galleta_escarcha','cocina',{fresa_escarcha:2,harina:1,azucar:1},40,1,2);
receta('pescado_empanado','cocina',{carpa:1,harina:1,aceite:1},30);
receta('racion_viajera','cocina',{pan:1,queso:1,zanahoria:1},30);
receta('antorcha','mano',{madera:1,carbon:1},0,0,4);
receta('fertilizante','mano',{fibra:4,heno:2},0,0,3);
receta('cebo_refinado','mano',{lombriz:3,fibra:2},0,0,5);
receta('banco_trabajo','mano',{madera:20,piedra:8},0);
receta('cofre_madera','mano',{madera:25},0);
receta('cofre_hierro','banco_trabajo',{cofre_madera:1,lingote_hierro:5},40,1);
receta('horno','mano',{piedra:25,cobre:8},0);
receta('cocina','mano',{piedra:18,madera:15,cobre:4},0);
receta('molino_artesanal','banco_trabajo',{madera:20,piedra:10,lingote_cobre:2},40);
receta('prensa','banco_trabajo',{madera:25,lingote_cobre:2},35);
receta('fermentador','banco_trabajo',{madera:30,resina:2,lingote_cobre:2},45);
receta('telar','banco_trabajo',{madera:25,cuerda:5},35);
receta('recicladora','banco_trabajo',{madera:10,piedra:15,lingote_hierro:2},45,1);
receta('forja','banco_trabajo',{piedra:30,lingote_hierro:5},60,1);
receta('fundidora','forja',{horno:1,lingote_acero:3,lingote_oro:2},90,2);
// La primera aleación de acero se obtiene en la forja: evita un desbloqueo circular.
RECETAS.push({id:'acero_forjado',nombre:'Acero de herrería',estacion:'forja',ingredientes:{lingote_hierro:3,carbon:4},salida:{articulo:'lingote_acero',cantidad:1},duracionMs:140_000,nivel:2});
receta('engranaje','forja',{lingote_hierro:2},35,1,2);
receta('bateria','banco_trabajo',{cuarzo:3,lingote_cobre:1,lingote_plata:1},60,1);
receta('aspersor_basico','mano',{lingote_cobre:1,lingote_hierro:1},0);
receta('recuperadora_cobre','banco_trabajo',{lingote_cobre:4,piedra:20,madera:15},45,1);
receta('recuperadora_hierro','forja',{recuperadora_cobre:1,lingote_hierro:6,engranaje:4},80,2);
receta('recuperadora_astral','forja',{recuperadora_hierro:1,lingote_titanio:4,bateria:2,cristal_astral:1},120,3);
receta('aspersor_cobre','banco_trabajo',{lingote_cobre:3,lingote_hierro:1},35,1);
// Bronce y mitrilo
receta('lingote_bronce','horno',{cobre:3,estano:2,carbon:1},40,0,2);
receta('lingote_mitrilo','fundidora',{mitrilo:5,carbon:4},160,4);
// Máquinas industriales
receta('alto_horno','forja',{horno:1,lingote_hierro:8,lingote_bronce:6,piedra:40},90,2);
receta('trituradora','banco_trabajo',{lingote_hierro:5,lingote_bronce:4,engranaje:4,piedra:20},70,2);
receta('taladro_vapor','forja',{lingote_acero:4,lingote_bronce:6,engranaje:6,bateria:1},120,3);
receta('ensambladora','forja',{lingote_acero:3,engranaje:8,bateria:2,vidrio:4},110,3);
// Alto horno: por tandas grandes
const tanda=(id:string,estacion:EstacionProduccion,ingredientes:Record<string,number>,articulo:string,cantidad:number,segundos:number,nivel=0)=>RECETAS.push({id,nombre:`${OBJETOS[articulo]?.nombre??articulo} ×${cantidad}`,estacion,ingredientes,salida:{articulo,cantidad},duracionMs:segundos*1000,nivel});
tanda('tanda_cobre','alto_horno',{cobre:12,carbon:1},'lingote_cobre',3,60,2);
tanda('tanda_bronce','alto_horno',{cobre:6,estano:4,carbon:1},'lingote_bronce',5,70,2);
tanda('tanda_hierro','alto_horno',{hierro:12,carbon:2},'lingote_hierro',3,80,2);
tanda('tanda_plata','alto_horno',{plata:12,carbon:2},'lingote_plata',3,90,2);
tanda('tanda_oro','alto_horno',{oro:12,carbon:3},'lingote_oro',3,100,2);
tanda('tanda_acero','alto_horno',{lingote_hierro:4,carbon:4},'lingote_acero',3,110,3);
tanda('tanda_titanio','alto_horno',{titanio:12,carbon:5},'lingote_titanio',3,140,3);
tanda('tanda_mitrilo','alto_horno',{mitrilo:12,carbon:6},'lingote_mitrilo',3,180,4);
// Trituradora: geodas → gemas, piedra → arena
tanda('triturar_geoda','trituradora',{geoda:1},'amatista',1,25,2);
tanda('triturar_geoda_cuarzo','trituradora',{geoda:2},'cuarzo',3,25,2);
tanda('triturar_helada','trituradora',{geoda_helada:1},'aguamarina',1,30,2);
tanda('triturar_helada_topacio','trituradora',{geoda_helada:2},'topacio',3,30,2);
tanda('triturar_magma','trituradora',{geoda_magma:1},'esmeralda',1,35,2);
tanda('triturar_magma_rubi','trituradora',{geoda_magma:2},'rubi',2,35,2);
tanda('triturar_omni','trituradora',{geoda_omni:1},'diamante',1,45,3);
tanda('moler_piedra','trituradora',{piedra:10},'arena',6,20,2);
// Taladro de vapor: mineral con carbón, en la granja
tanda('taladrar_cobre','taladro_vapor',{carbon:1},'cobre',5,90,3);
tanda('taladrar_estano','taladro_vapor',{carbon:1},'estano',4,90,3);
tanda('taladrar_hierro','taladro_vapor',{carbon:2},'hierro',4,120,3);
tanda('taladrar_oro','taladro_vapor',{carbon:3},'oro',3,150,4);
tanda('taladrar_titanio','taladro_vapor',{carbon:5},'titanio',2,240,4);
// Ensambladora: piezas en serie
tanda('serie_engranajes','ensambladora',{lingote_hierro:3},'engranaje',5,40,3);
tanda('serie_baterias','ensambladora',{cuarzo:5,lingote_cobre:2,lingote_plata:1},'bateria',3,70,3);
tanda('serie_circuitos','ensambladora',{bateria:3,lingote_oro:2,cristal_astral:1},'circuito_astral',2,110,4);
receta('aspersor_hierro','banco_trabajo',{aspersor_cobre:1,lingote_hierro:4,engranaje:2},55,2);
receta('aspersor_astral','forja',{aspersor_hierro:1,lingote_titanio:2,bateria:2,cristal_astral:1},90,3);
for(const [metal,_nombre,_ataque,_defensa,_precio] of metales){
 const material=metal==='obsidiana'?'obsidiana':`lingote_${metal}`;
 const nivel=({cobre:0,bronce:1,hierro:1,oro:2,obsidiana:2,titanio:3,mitrilo:4,astral:4} as Record<string,number>)[metal]??4;
 receta(`espada_${metal}`,'forja',{[material]:2,madera:3},45+nivel*15,nivel);
 receta(`casco_${metal}`,'forja',{[material]:3,tela:1},45+nivel*15,nivel);
 receta(`pechera_${metal}`,'forja',{[material]:5,tela:2},55+nivel*15,nivel);
 receta(`botas_${metal}`,'forja',{[material]:2,cuero:1},40+nivel*15,nivel);
}
receta('circuito_astral','forja',{bateria:2,lingote_oro:2,cristal_astral:1},100,3);
receta('arco_ribera','banco_trabajo',{madera:8,fibra:6,cobre:2},30,0);
receta('baston_cuarzo','banco_trabajo',{madera:6,cuarzo:3,cobre:2},30,0);
receta('sello_fuego','banco_trabajo',{piedra:6,carbon:4,cuarzo:2},30,0);
receta('sello_agua','banco_trabajo',{piedra:6,arcilla:4,cuarzo:2},30,0);
receta('sello_tierra','banco_trabajo',{piedra:8,cobre:2,cuarzo:2},30,0);
receta('sello_aire','banco_trabajo',{madera:6,fibra:4,cuarzo:2},30,0);
tanda('flechas_ribera','mano',{madera:2,piedra:1},'flecha_ribera',4,0);
receta('combustible_estelar','fundidora',{carbon:5,meteorita:2,polvo_estelar:1},65,3,3);
receta('portal_verdia','banco_trabajo',{madera_ancestral:15,jade:4,lingote_cobre:8,cristal:10},100,1);
receta('portal_senda','banco_trabajo',{lingote_plata:8,cuarzo:15,jade:4,bateria:3},120,2);
receta('portal_nox','forja',{obsidiana:20,lingote_oro:6,cristal:15,rubi:5},150,3);
// El despegue sólo exige materiales terrestres; ningún recurso espacial bloquea la primera nave.
receta('nave_exploradora','forja',{lingote_acero:12,lingote_oro:8,lingote_plata:6,vidrio:12,bateria:8,engranaje:10},240,3);

for(const r of TERRITORIOS_REGIONALES){objeto(r.producto,'Pieza ajustada · '+r.nombre,'insumo',0,{precioCompra:0});objeto(r.fauna.producto,'Aporte conservado · '+r.fauna.nombre,'insumo',0,{precioCompra:0});}
export function obtenerObjeto(id:string):DefObjeto|undefined{const normal=Object.hasOwn(OBJETOS,id)?OBJETOS[id]:undefined;if(normal)return normal;const h=leerHuevo(id);return h?{id,nombre:'Huevo fértil de '+ESPECIES[h.especie].nombre.toLowerCase()+' · '+(h.sexo==='hembra'?'hembra':'macho'),categoria:'producto',rareza:'inusual',precioCompra:0,precioVenta:Math.max(10,Math.floor(ESPECIES[h.especie].precio/3)),pilaMax:20,descripcion:'Conserva su genotipo y sexo. Incúbalo en un refugio de su especie; avanza solo al dormir.'}:undefined;}
objeto('fertilizante_mejorado','Abono mejorado','insumo',25,{precioCompra:75});
RECETAS.push({id:'fertilizante_mejorado',nombre:'Abono mejorado',estacion:'mano',ingredientes:{fertilizante:3,cuarzo:1},salida:{articulo:'fertilizante_mejorado',cantidad:2},duracionMs:0,nivel:1});
for(const f of FRUTALES){const id='mermelada_'+f.producto;objeto(id,'Mermelada de '+f.producto,'comida',f.valor*3,{comida:{energia:25,vida:8},pilaMax:99});receta(id,'prensa',{[f.producto]:3,azucar:1},50);}
for(const [id,nombre,precio] of [['leche_cabra','Leche de cabra',35],['huevo_pato','Huevo de pato',30],['huevo_avestruz','Huevo de avestruz',95],['huevo_dinosaurio','Huevo ancestral',160]] as const)objeto(id,nombre,'producto',precio,{pilaMax:99});
objeto('cubo_ordeno','Cubo de ordeño','herramienta',35,{precioCompra:80,pilaMax:1,descripcion:'Selecciona el cubo en la barra y acércate a una vaca o cabra adulta.'});
objeto('tijeras_esquila','Tijeras de esquila','herramienta',45,{precioCompra:100,pilaMax:1,descripcion:'Selecciona las tijeras para esquilar ovejas adultas con lana disponible.'});
objeto('pluma_pato','Pluma de pato','producto',45);
objeto('queso_cabra','Queso de cabra','comida',130,{comida:{energia:32,vida:12},pilaMax:99});
objeto('mayonesa_pato','Mayonesa de pato','comida',100,{comida:{energia:25,vida:10},pilaMax:99});
objeto('mayonesa_avestruz','Mayonesa de avestruz','comida',155,{comida:{energia:35,vida:15},pilaMax:99});
objeto('mayonesa_antigua','Mayonesa prehistórica','comida',240,{comida:{energia:40,vida:20},pilaMax:99});
receta('cubo_ordeno','mano',{madera:3,lingote_cobre:2},0);
receta('tijeras_esquila','banco_trabajo',{lingote_hierro:2,madera:2},25,1);
receta('queso_cabra','prensa',{leche_cabra:2,sal:1},50);
receta('mayonesa_pato','prensa',{huevo_pato:1,aceite:1},40);
receta('mayonesa_avestruz','prensa',{huevo_avestruz:1,aceite:2},60,0,3);
receta('mayonesa_antigua','prensa',{huevo_dinosaurio:1,aceite:2},80);
RECETAS.push(...RECETAS_CORRESPONDENCIA);
RECETAS.push(...RECETAS_LIBROS);
for(const r of RECURSOS_ASTRA){
 objeto('kit_'+r.id,'Mantenimiento · '+r.nombre,'insumo',0,{precioCompra:0,descripcion:'Reduce en uno la energía de recolección solo en su región durante ocho estancias. Un único kit activo, sin aumentar cupos ni combate.'});
 receta('kit_'+r.id,'banco_trabajo',{[r.id+'_mineral']:2,[r.id+'_madera']:2,[r.id+'_cosecha']:1},45);
 for(const d of r.recursos)if(['mineral','madera'].includes(d.clase))objeto(d.id,d.nombre,d.clase==='mineral'?'mineral':'recurso',0,{precioCompra:0,descripcion:d.usos.join(' ')});
 RECETAS.push({id:'flechas_'+r.id,nombre:'Munición · '+r.nombre,estacion:'banco_trabajo',ingredientes:{[r.id+'_mineral']:1,[r.id+'_madera']:2},salida:{articulo:'flecha_ribera',cantidad:4},duracionMs:12000,nivel:0});
 RECETAS.push({id:'racion_'+r.id,nombre:'Ración · '+r.nombre,estacion:'cocina',ingredientes:{[r.id+'_cosecha']:1,sal:1},salida:{articulo:'pan',cantidad:1},duracionMs:30000,nivel:0});
 for(const d of r.recursos)if(d.clase==='semilla'&&OBJETOS[d.id]){OBJETOS[d.id].precioCompra=0;OBJETOS[d.id].precioVenta=0;}
}
for(const p of PREMIOS_NARRATIVOS){if(p.plano?.tipo!=='receta')continue;const base=RECETAS.find(r=>r.id===p.plano!.base);if(base)RECETAS.push({...base,id:'variante_'+p.id,nombre:p.nombre+' · '+base.nombre,ingredientes:{...base.ingredientes},salida:{...base.salida},premioNarrativo:p.id,baseNarrativa:base.id});}

for(const r of TERRITORIOS_REGIONALES){
 objeto('kit_ajustado_'+r.id,'Kit ajustado · '+r.nombre,'insumo',0,{precioCompra:0});
 RECETAS.push({id:'kit_ajustado_'+r.id,nombre:'Kit ajustado · '+r.nombre,estacion:'banco_trabajo',ingredientes:{[r.producto]:1,[r.id+'_mineral']:1,[r.id+'_madera']:2,[r.id+'_cosecha']:1},salida:{articulo:'kit_ajustado_'+r.id,cantidad:1},duracionMs:15000,nivel:0});
 if(r.fauna.colonia)RECETAS.push({id:'pieza_colonia_'+r.id,nombre:'Pieza de atención · '+r.nombre,estacion:'banco_trabajo',ingredientes:{[r.fauna.producto]:1,[r.id+'_mineral']:1},salida:{articulo:r.producto,cantidad:1},duracionMs:10000,nivel:0});
}
receta('trampa_cebo','mano',{madera:8,fibra:6},0);
receta('terminal_carga','banco_trabajo',{lingote_hierro:2,engranaje:1,bateria:1},20);
receta('exportador_envios','banco_trabajo',{madera:8,lingote_cobre:2,engranaje:1},15);
receta('conector_produccion','mano',{madera:2,fibra:2},0);
RECETAS.push({id:'trampa_documentada',nombre:'Trampa de cuencas documentadas',estacion:'mano',ingredientes:{madera:8,fibra:4},salida:{articulo:'trampa_cebo',cantidad:1},duracionMs:0,nivel:0,requisito:'museo_cuencas'});
for(const r of TERRITORIOS_REGIONALES)RECETAS.push({id:'conector_documentado_'+r.id,nombre:'Conector documentado · '+r.nombre,estacion:'mano',ingredientes:{madera:2,fibra:1},salida:{articulo:'conector_produccion',cantidad:1},duracionMs:0,nivel:0,requisito:'museo_'+r.id});
for(const d of ACCESOS_CAMPANA)RECETAS.push({id:d.id,nombre:d.nombre,estacion:'banco_trabajo',ingredientes:{...d.materiales},salida:{articulo:d.id,cantidad:1},duracionMs:60000,nivel:0,requisito:'campana_'+d.permiso});
const INDICE_RECETAS=new Map(RECETAS.map(r=>[r.id,r]));
export function obtenerReceta(id:string):RecetaProduccion|undefined{return INDICE_RECETAS.get(id);}

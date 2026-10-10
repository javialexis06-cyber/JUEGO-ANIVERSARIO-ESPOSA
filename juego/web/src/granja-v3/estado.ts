import type { EstadoCorreo, AccionCorreo } from './correo';
import type { EstadoVidaSocial, AccionSocial } from './vida-social';
import type { EstadoEncargos, AccionEncargo } from './encargos';
import type { EstadoPueblo, Conversacion } from './aldeanos';
import type { EstadoObras } from './construccion';
import type { EstadoCompania, AccionCompania } from './compania';
import type { RutinaAnimal } from './rutinas-ganado';
import type { EstadoGanaderia } from './ganaderia';
import type { EstadoHabilidades, GananciaExperiencia } from './habilidades';
import type { Frutal } from './frutales';
import type { Invernadero } from './invernadero';
import type { EstadoEnvios } from './envios';
import type { Genome, Species } from './genetica';
import type { AnimalCare, CropCare } from './cuidados';
import type { Clima, Herramienta, Zona } from './catalogo';
import type { Pila } from './inventario';
import type { Servicio } from './progresion';
import type { CampoCultivo } from './agricultura';
import type { EstadoBarra, RanuraEquipo } from './barra';
import type { EstadoProduccion, AccionProduccion } from './produccion';
import type { EstadoAventura, PuntoAventura } from './aventura';
import type { PaisajeGranja } from './paisaje';
import type { Jornada, ResumenJornada } from './jornada';
import type { EstadoTiempo } from './clima';

export interface Animal {id:string;nombre:string;especie:Species;sexo:'hembra'|'macho';genoma:Genome;nacimiento:number;edadDias:number;ultimoCruce:number|null;edificioId:string;cuidado:AnimalCare;productos:number;ultimoProductoAt:number;ultimoDiaExperiencia?:number;productoLegado?:boolean;rutina?:RutinaAnimal}
export interface Edificio {nivel?:1|2|3;id:string;articulo:string;x:number;z:number;giro:number;especie?:Species;clima:Clima;pasto:number;ultimoPastoAt:number;puertaGanado?:boolean;henoReserva?:number;henoCalidades?:[number,number,number,number]}
export interface Obstaculo {id:string;tipo:'arbol'|'roca'|'maleza'|'ruina';x:number;z:number;sectorId:number;hp:number;hpMax:number;zona?:Zona;nivelMina?:number;regeneraEn:number|null;gigante?:boolean}
export interface Drop {id:string;articulo:string;cantidad:number;x:number;z:number;zona:Zona;nivelMina?:number}
export interface Parcela {campo?:CampoCultivo;x:number;z:number;cultivo:string|null;cuidado:CropCare|null}
export interface EstadoGranja extends EstadoBarra {
 correo:EstadoCorreo;vidaSocial:EstadoVidaSocial;encargos:EstadoEncargos;pueblo:EstadoPueblo;obras:EstadoObras;compania:EstadoCompania;ganaderia:EstadoGanaderia;habilidades:EstadoHabilidades;jornada:Jornada;tiempo:EstadoTiempo;envios:EstadoEnvios;frutales:Frutal[];invernaderos:Invernadero[];
 paisaje?:PaisajeGranja;posicionExterior?:{zona:Zona;x:number;z:number};
 produccion:EstadoProduccion;aventura:EstadoAventura;posicionAventura:PuntoAventura|null;
 version:5;revision:number;ultimoTiempo:number;inicioTiempo:number;monedas:number;inventario:Record<string,number>;casillasInventario:(Pila|null)[];almacenMigracion:Record<string,number>;nivelesHerramienta:Record<string,number>;mejoraHerramienta:{herramienta:Herramienta;nivel:number;hasta:number}|null;servicio:Servicio|null;drops:Drop[];ultimoGolpeAt:number;herramienta:Herramienta;personaje:'ella'|'el';sectorIds:number[];
 edificios:Edificio[];obstaculos:Obstaculo[];parcelas:Parcela[];animales:Animal[];estadisticas:Record<string,number>;misionesCompletadas:string[];desbloqueos:string[];tokensCasa:string[];
 zona:Zona;interior:string|null;vida:number;energia:number;enemigo:number;nivelMina:number;ayudante:{desde:number;hasta:number;ultimoTurno:number}|null;secuencia:number;
}
export type Accion =
 |{tipo:'correo';accion:AccionCorreo;xJugador:number;zJugador:number}
 |{tipo:'entrar_dormitorio';npcId:string;xJugador:number;zJugador:number}
 |{tipo:'inspeccionar_mueble';mueble:'escritorio'|'biblioteca';xJugador:number;zJugador:number}
 |{tipo:'entrar_vivienda';id:string;xJugador:number;zJugador:number}
 |{tipo:'social';accion:AccionSocial;xJugador:number;zJugador:number}
 |{tipo:'encargo';accion:AccionEncargo;xJugador:number;zJugador:number}
 |{tipo:'hablar_aldeano';npcId:string;xJugador:number;zJugador:number}
 |{tipo:'regalar_aldeano';npcId:string;casilla:number;xJugador:number;zJugador:number}
 |{tipo:'encargar_obra';articulo:string}
 |{tipo:'ampliar_refugio';edificioId:string}
 |{tipo:'emplazar_obra';id:string;x:number;z:number;giro?:number}
 |{tipo:'cancelar_obra';id:string}
 |{tipo:'compania';accion:AccionCompania;xJugador:number;zJugador:number}
 |{tipo:'puerta_ganado';edificioId:string;xJugador:number;zJugador:number}
 |{tipo:'abastecer_refugio'|'retirar_heno';edificioId:string;cantidad:number;xJugador:number;zJugador:number}
 |{tipo:'ordenar'|'esquilar'|'buscar_trufas';animalId:string;xJugador:number;zJugador:number}
 |{tipo:'recoger_trufa';id:string;xJugador:number;zJugador:number}
 |{tipo:'instalar_incubadora'|'ampliar_incubadora'|'cancelar_incubacion';edificioId:string}
 |{tipo:'incubar';edificioId:string;casilla:number;nombre?:string}
 |{tipo:'comprar_huevo_fertil';especie:Species;sexo:'hembra'|'macho';variante?:number}
 |{tipo:'trasladar_animal';animalId:string;edificioId:string}
 |{tipo:'elegir_profesion';profesion:string}
 |{tipo:'plantar_frutal';frutal:string;x:number;z:number;xJugador:number;zJugador:number}
 |{tipo:'recoger_frutal'|'golpear_frutal';id:string;xJugador:number;zJugador:number}
 |{tipo:'instalar_riego_invernadero';edificioId:string}
 |{tipo:'restaurar_invernadero';obstaculoId:string;xJugador:number;zJugador:number}
 |{tipo:'envio';edificioId:string;sentido:'depositar'|'retirar';casilla:number;cantidad:number;xJugador:number;zJugador:number}
 |{tipo:'dormir';jornada:number;edificioId:string;xJugador:number;zJugador:number}
 |{tipo:'continuar_dia';jornada:number}
 |{tipo:'rellenar_hueco';id:string;xJugador:number;zJugador:number}
 |{tipo:'produccion';accion:AccionProduccion;xJugador:number;zJugador:number}
 |{tipo:'fertilizar';x:number;z:number;articulo:string}
 |{tipo:'vender_pila';casilla:number;cantidad?:number}
 |{tipo:'comprar_objeto';articulo:string;cantidad?:number}
 |{tipo:'entrar_aventura';destino:string;xJugador:number;zJugador:number}
 |{tipo:'salir_aventura'}|{tipo:'descender_aventura';xJugador:number;zJugador:number}
 |{tipo:'accion_aventura';objetivo:'monstruo'|'nodo'|'botin'|'situacion';id:string;xJugador:number;zJugador:number}
 |{tipo:'seleccionar_casilla';casilla:number}|{tipo:'fila_barra';fila:number}|{tipo:'consumir';casilla?:number}
 |{tipo:'equipar_objeto';casilla:number}|{tipo:'desequipar_objeto';ranura:RanuraEquipo}
 |{tipo:'herramienta';herramienta:Herramienta}|{tipo:'personaje';personaje:'ella'|'el'}
 |{tipo:'limpiar'|'reparar'|'labrar'|'alisar'|'regar'|'cosechar';x:number;z:number;xJugador?:number;zJugador?:number;direccion?:{x:number;z:number}}|{tipo:'plantar';x:number;z:number;cultivo:string;xJugador?:number;zJugador?:number}
 |{tipo:'golpear';obstaculoId:string;xJugador:number;zJugador:number}|{tipo:'recoger_drop';dropId:string;xJugador:number;zJugador:number}
 |{tipo:'mover_item';desde:number;hasta:number;cantidad?:number}|{tipo:'ampliar_mochila'}|{tipo:'recuperar_almacen';articulo:string;cantidad?:number}
 |{tipo:'entrar_servicio';servicio:Servicio;xJugador?:number;zJugador?:number}|{tipo:'salir_servicio'}|{tipo:'mejorar_herramienta';herramienta:Herramienta}|{tipo:'retirar_mejora'}
 |{tipo:'sector';sectorId:number}|{tipo:'construir';articulo:string;x:number;z:number;giro?:number}
 |{tipo:'mover';edificioId:string;x:number;z:number;giro?:number}|{tipo:'girar'|'retirar_edificio';edificioId:string}
 |{tipo:'comprar'|'craftear'|'vender';articulo:string;cantidad?:number}
 |{tipo:'pasto'|'jardinero';edificioId:string}|{tipo:'entrar';edificioId:string;xJugador?:number;zJugador?:number}|{tipo:'salir'}
 |{tipo:'adoptar';especie:Species;sexo:'hembra'|'macho';nombre?:string;variante?:number|string;edificioId?:string;cria?:boolean}
 |{tipo:'criar';madreId:string;padreId:string}|{tipo:'cuidar';animalId:string;metodo:'alimentar'|'acariciar'|'musica'|'cuento'|'cepillar'}
 |{tipo:'medico'|'recoger';animalId:string;xJugador?:number;zJugador?:number}|{tipo:'viajar';zona:Zona;ruta?:string;xJugador?:number;zJugador?:number}|{tipo:'pescar';precision?:number;cebo?:string}
 |{tipo:'combatir'|'extraer'|'descansar'|'ayudante'|'descender'}|{tipo:'reclamar';misionId:string};
export interface Resultado {conversacion?:Conversacion;ok:boolean;mensaje:string;experiencia?:GananciaExperiencia[];resumenJornada?:ResumenJornada;posicionZona?:{x:number;z:number};posicionAventura?:PuntoAventura;area?:{x:number;z:number}[];impacto?:{obstaculoId:string;x:number;z:number;tipo:Obstaculo['tipo'];hp:number;hpMax:number;destruido:boolean;dano:number};recogida?:{dropId:string;articulo:string;cantidad:number}}

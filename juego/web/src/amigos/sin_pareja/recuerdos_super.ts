// Versión para amigos de los recuerdos del súper: no lleva ninguno (las cartas son solo de la pareja).
export interface RecuerdoSuper {
  dia: number;
  titulo: string;
  texto: string;
  firma: string;
}

export const TEXTOS_CARTAS = {
  sello: '',
  boton: (_abiertos: number, _total: number) => '',
  nueva: '',
  fecha: (_dia: number) => '',
  lista: { fecha: '', titulo: '', texto: '' },
};

export const DIA_FINAL: { evento: string; texto: string } | null = null;

export const RECUERDOS_SUPER: RecuerdoSuper[] = [];

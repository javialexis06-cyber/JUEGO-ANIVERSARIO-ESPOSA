// Los 28 capítulos de la película de Astra en el orden en que se viven (docs/en-obra/pelicula-de-astra.md, capítulo 3):
// los usan los créditos de la boda y la sala de cine. El id es el de `cine-catalogo.ts` y el de su foto
// (public/granja/cine/fotos/<id>.jpg).
/** Los capítulos de la película (con el id de cada una: su foto está en granja/cine/fotos/<id>.jpg). */
export const CAPITULOS: [string, string][] = [
  ['prologo', 'Prólogo · El nacimiento de Celia'], ['C01', 'Dos surcos'], ['C11', 'El agua que escucha'], ['SC0', 'La Noche Eterna'],
  ['C02', 'La campana y la mesa'], ['ELI', 'El brote que puede esperar'], ['SC1', 'Las Afueras'], ['C03', 'La firma'], ['SC2', 'El fuego bajo la piedra'],
  ['T03', 'La cría que no quiere hablar'], ['SC3', 'El Santuario roto'], ['C04', 'La copa'], ['C05', 'Una mañana que no basta'], ['SC4', 'El descenso'],
  ['S08', 'La ayuda que no llegó'], ['C12', 'El día posterior al nacimiento'], ['ENE', 'Lo que no vuelve idéntico'], ['OFE', 'La casa que dejé esperando'],
  ['C06', 'La casa de Elián'], ['SER', 'El nombre que no se pronuncia por otro'], ['C13', 'El precio de una alianza'], ['C14', 'La cuenta que ya no se cierra sola'],
  ['C07', 'El tratado'], ['C08', 'El ceramista'], ['C09', 'Una estrella sin dueño'], ['C10', 'La parcela de mañana'], ['ALT', 'El Altar del Lazo'], ['BOD', 'Siempre te elegiré'],
];

/** Los actos, con los capítulos que van en cada uno. */
export const ACTOS: { nombre: string; ids: string[] }[] = [
  { nombre: 'Prólogo', ids: ['prologo'] },
  { nombre: 'Acto I · Lo que parecía un surco', ids: ['C01', 'C11', 'SC0', 'C02', 'ELI', 'SC1', 'C03'] },
  { nombre: 'Acto II · La Noche prestada', ids: ['SC2', 'T03', 'SC3', 'C04', 'C05', 'SC4'] },
  { nombre: 'Acto III · El refugio con dueño', ids: ['S08', 'C12', 'ENE', 'OFE', 'C06', 'SER'] },
  { nombre: 'Acto IV · Un pacto que admite límites', ids: ['C13', 'C14'] },
  { nombre: 'Acto V · La vasija abierta', ids: ['C07', 'C08', 'C09', 'C10'] },
  { nombre: 'Epílogo · El Hogar', ids: ['ALT', 'BOD'] },
];

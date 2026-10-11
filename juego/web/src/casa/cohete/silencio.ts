// Mientras suena la canción del primer despegue («Del baño a la NASA»), no se mete nada encima: ni las voces ni los
// efectos del vuelo (el globito con la frase sí sale, mudo). Después, todo suena como siempre.
import { musica, nota as notaBase, rumor as rumorBase } from '../../sonido';

export const cantando = () => musica.pistaSonando() === 'cohete-cancion';
export const nota: typeof notaBase = (...a) => {
  if (!cantando()) notaBase(...a);
};
export const rumor: typeof rumorBase = (...a) => {
  if (!cantando()) rumorBase(...a);
};

# Nuestro Hogar · la mascota de pareja

El juego principal: una casita para Él y Ella. Cada uno abre la app en su celular (Bucaramanga y Medellín), cuida a
su personaje y consiente al del otro. Lo que hace uno le llega al otro al instante (Supabase, ver
[`supabase.md`](supabase.md)). El súper de barrio (Súper Manía) queda como **minijuego** que paga monedas para la casa.

## La casa

Cuatro cuartos tipo diorama, en plastilina como las tiendas (`personajes/blender/casa.py`):

| Cuarto | Qué se hace | Efecto |
|---|---|---|
| Sala | Descansar en el sofá · Ver tele (sentados) | +8 energía · +4 energía y +2 cariño |
| Cocina | Comer (sentado en la silla del comedor, con la comida en la mano) · Notas en la nevera | según la comida |
| Baño | Bañarse (en la tina con burbujas) · Lavarse en el lavamanos | higiene al 100 · +25 higiene |
| Cuarto | Dormir (acostado en la cama) · Cambiarse en el clóset | +16 energía por hora dormido · +12 higiene |

Se cambia de cuarto con las pestañas de abajo; cada pestaña muestra la carita de quién está ahí.
Tocar el piso hace caminar a tu personaje; tocar al otro abre sus mimos; tocar la nevera abre las notas.

## Necesidades

Comida, energía, higiene y cariño (0 a 100). Bajan con el reloj real, **también con la app cerrada**
(por hora: comida 8, energía 6, higiene 4, cariño 5; dormido la comida y la higiene bajan a la mitad y la energía sube 16).

- La cara muestra el ánimo (la necesidad más baja): feliz ≥ 60, normal ≥ 30, triste por debajo (cara y pose tristes).
- Con poca higiene aparece barro en la cara y la ropa (3 niveles).
- Si algo está por debajo de 30, sale un globo de pensamiento con lo que necesita.
- Despierta solo cuando la energía llega a 100 (o con el botón Despertar).

## Mimos con la pareja

| Mimo | Tu cariño | Su cariño | Primer mimo del día |
|---|---|---|---|
| Caricia | +4 | +10 | +5 monedas |
| Abrazo | +15 | +15 | +8 monedas |
| Beso | +20 | +20 | +10 monedas |

Tu personaje camina hasta el otro (aunque esté en otro cuarto), se ponen de perfil y posan juntos, con corazones.
Si el otro está dormido, sonríe entre sueños. También se puede **llevarle comida** (sube su comida), **saludar** y
**dejar notas** en la nevera (se ven pegadas en la puerta).

## Regalos

Se compran en la tienda y se entregan con un mensaje. A quien lo recibe le aparece una cajita junto a su personaje;
al abrirla ve el regalo, el mensaje y sube su cariño.

| Regalo | Precio | Cariño | Extra |
|---|---|---|---|
| Carta de amor | 5 | +15 | |
| Cajita sorpresa | 15 | +20 | trae una comida al azar |
| Chocolates | 20 | +25 | +8 comida |
| Ramo de flores | 25 | +30 | |
| Osito de peluche | 40 | +40 | se queda para decorar |

## Monedas (de los dos)

- Bono del día: +20 para cada uno al abrir la app.
- Primeros mimos del día (tabla de arriba) y +50 el día del aniversario.
- **Sueldo del súper**: un tercio de la ganancia de cada día jugado en Súper Manía.

Se gastan en comida (3 a 18), regalos (5 a 40) y decoración (20 a 45).

## Decoración

Botón Decorar: aparecen aros rojos en los sitios del cuarto (pared, piso, mesa, sofá/cama). Se pone lo que tengan
guardado; quitarlo lo devuelve. Cuadros (corazón, montañas y **marco con una foto del álbum**), matera, cactus,
lámpara, globos, osito, florero y velas (`personajes/blender/regalos.py`).

## Recuerdos y fechas

- **Álbum**: fotos con título y fecha (se reducen a 1280 px). En línea van a la carpeta privada de la pareja.
- **Fechas**: el aniversario y otras fechas (cumpleaños, primera cita…) con cuenta regresiva; arriba aparece
  «Faltan N días» cuando falta un mes o menos. El día del aniversario llueven corazones.
- Al volver a la app: «Mientras no estabas, Ella te dejó 2 besos y 1 regalo».

## Técnica

- Personajes con esqueleto: una animación fija por pose (tienda + mascota) mezclada con pesos; las caras se arman
  mostrando mallas ocultas (ojos felices, boca de beso, de hablar, triste, barro) y parpadean solas.
- Coreografías medidas con el reloj del juego: quien recibe el mimo espera a que el otro llegue.
- Modo local (sin internet, o dos pestañas del mismo navegador) con la misma interfaz que el modo en línea.

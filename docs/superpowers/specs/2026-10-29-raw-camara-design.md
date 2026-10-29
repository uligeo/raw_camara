# Raw Cámara - Documento de diseño

Fecha: 2026-10-29
Estado: pendiente de aprobación

## 1. Intención

Una aplicación web instalable (PWA) que convierte el teléfono en una cámara
de película simulada. El usuario abre la app, encuadra, elige un carrete,
dispara, y después ajusta la imagen con un editor completo antes de
guardarla en su teléfono.

El porqué: el usuario quiere una cámara con carácter propio, que funcione
sin conexión y sin instalar nada desde una tienda de aplicaciones. Se
publica en Vercel y se instala desde el navegador.

La referencia visual es la captura `IMG_1293.PNG` en la raíz del
repositorio: cabecera oscura con acciones a los lados, imagen a pantalla
casi completa, carrete horizontal de películas, fila de pestañas
(LIGHT, FILM, OPTICS, EFFECTS, CROP) y un control de valor único en la
parte inferior con regla numérica.

## 2. Objetivos

1. Capturar fotografías con la cámara del dispositivo desde la propia app.
2. Previsualizar la película seleccionada en vivo sobre el visor, antes de
   disparar.
3. Editar la foto capturada con cinco grupos de ajustes: LIGHT, FILM,
   OPTICS, EFFECTS y CROP.
4. Guardar el resultado en el carrete del teléfono.
5. Funcionar sin conexión una vez instalada: arrancar, disparar, editar y
   guardar sin red.
6. Conservar las capturas sin guardar entre sesiones, de forma que cerrar
   la app no pierda trabajo.

## 3. No objetivos

Quedan fuera de este diseño. No son rechazos permanentes, simplemente no
entran ahora.

- RAW real. El navegador no da acceso al sensor; `getUserMedia` entrega
  fotogramas ya procesados por el sistema operativo. No habrá negativo
  editable ni archivos DNG. La cabecera no mostrará un distintivo RAW
  porque sería falso.
- Cuentas de usuario, servidor propio, sincronización o copia en la nube.
- Compartir en redes sociales desde dentro de la app, más allá de lo que
  ofrezca la hoja de compartición del sistema.
- Vídeo.
- Geocodificación inversa. El nombre de ciudad que aparece en la captura
  de referencia requiere red y un servicio externo; la cabecera mostrará
  solo la hora de la captura.
- Ajustes guardados por el usuario, galería interna navegable, historial
  de ediciones más allá de deshacer y rehacer.

## 4. Anti objetivos

Formas de fracasar aunque todo funcione técnicamente.

- Un visor a tirones. Si la vista previa en vivo no se mantiene fluida en
  un teléfono de gama media, la app deja de sentirse como una cámara.
- Un paquete tan pesado que la instalación o el primer arranque resulten
  lentos con datos móviles.
- Imitar marcas reales de película fotográfica. Los carretes tienen
  nombres y estética propios; no se usan nombres, logotipos ni envases de
  marcas existentes.
- Una interfaz que tape la imagen. La foto manda; los controles son
  oscuros, compactos y se apartan.

## 5. Restricciones

- Se publica en Vercel como sitio estático. No hay backend ni funciones
  de servidor.
- Todo el procesado de imagen ocurre en el dispositivo.
- La cámara web exige HTTPS. Vercel lo cubre; en desarrollo hace falta
  `localhost` o HTTPS local.
- iOS: la captura de cámara dentro de una PWA instalada requiere iOS 14.3
  o superior. Por debajo de esa versión la app debe detectarlo y explicar
  que hay que abrirla en Safari.
- Presupuesto de precarga del service worker: 20 MB como máximo duro,
  objetivo por debajo de 12 MB. Las texturas (tablas de color, fugas de
  luz, polvo) son el grueso y hay que vigilarlas.
- Estilo de código según las directrices del usuario: sin emojis ni
  iconografía en código ni comentarios, archivos por debajo de 400 líneas,
  nada de credenciales en el código.

## 6. Decisiones ya tomadas

### 6.1 Pila técnica

- React con TypeScript sobre Vite.
- `vite-plugin-pwa` con Workbox en modo `generateSW` para el manifiesto y
  el service worker. Estrategia: precarga de todos los recursos estáticos,
  incluidas texturas y fuentes.
- WebGL para el procesado de imagen. No se usa el filtro CSS ni el canvas
  2D para los ajustes: no alcanzan ni en calidad ni en rendimiento.
- Vitest para pruebas.
- Sin librería de componentes. La interfaz es específica y pequeña; una
  librería genérica pesaría más de lo que aporta.

### 6.2 Arquitectura de render

Dos recorridos distintos sobre el mismo conjunto de shaders:

**Visor en vivo.** El fotograma del elemento `<video>` se sube como
textura y se procesa con un recorrido corto: película (tabla de color) y
exposición. Se renderiza a la resolución de pantalla, no a la del sensor.
El resto de ajustes no se aplican en vivo.

**Imagen capturada.** Al disparar se obtiene el fotograma a la máxima
resolución disponible y se procesa el recorrido completo en framebuffers
encadenados, a resolución nativa. Aquí no hay presión de tiempo real.

Esta separación es la decisión central del diseño y responde al riesgo de
rendimiento. Si se intentara el recorrido completo en vivo, treinta
parámetros encadenados a treinta fotogramas por segundo no se sostienen en
hardware medio.

Orden del recorrido completo, de primero a último:

1. Distorsión geométrica y focal simulada (OPTICS).
2. Exposición, contraste, altas luces, sombras, temperatura, tinte,
   saturación (LIGHT).
3. Tabla de color de la película (FILM).
4. Halación y difusión de altas luces (EFFECTS).
5. Aberración cromática, viñeteado, desenfoque de bordes (OPTICS).
6. Grano (FILM).
7. Superposiciones: fugas de luz, polvo y rayas, destello (EFFECTS).
8. Recorte, rotación y espejo (CROP).
9. Sello de fecha, si está activo (EFFECTS).

El grano va después de la película y antes de las superposiciones porque
en película real el grano es del negativo, no de la copia. El sello de
fecha va al final porque se imprime sobre la copia ya revelada.

### 6.3 Captura

`navigator.mediaDevices.getUserMedia` con `facingMode` conmutable entre
cámara trasera y frontal, pidiendo la mayor resolución que ofrezca el
dispositivo.

Para el disparo: `ImageCapture.takePhoto()` cuando el navegador lo soporte,
ya que entrega más resolución que el flujo de vídeo. Cuando no exista, que
es el caso de Safari, se dibuja el fotograma del `<video>` en un canvas a
la resolución de la pista. La app no debe suponer que el primer camino
existe.

### 6.4 Las cinco pestañas

**LIGHT.** Exposición, contraste, altas luces, sombras, temperatura, tinte,
saturación. Siete controles de rango.

**FILM.** El carrete horizontal de películas con vista previa, más tres
submodos, que son los tres botones redondos de la captura de referencia:

- Grano: cantidad y tamaño.
- Textura: intensidad de la textura del soporte.
- Revelado: desplazamiento de exposición y contraste tipo empuje o
  arrastre del revelado, en pasos.

**OPTICS.** Focal simulada como selector discreto (24, 28, 35, 50, 85 mm),
donde 35 mm es la base sin alterar: por debajo se introduce distorsión de
barril y por encima se recorta hacia el centro. Además viñeteado,
aberración cromática y desenfoque de bordes, los tres como controles de
rango.

**EFFECTS.** Fugas de luz, halación, polvo y rayas, destello, y sello de
fecha. Los cuatro primeros con control de intensidad; el sello es un
interruptor con el formato de fecha y hora de la captura, en naranja,
esquina inferior derecha.

**CROP.** Proporciones 1:1, 4:3, 3:2, 16:9 y libre, rotación continua,
enderezado y espejo horizontal.

### 6.5 Películas

Entre cinco y siete carretes, con nombre, envase dibujado y carácter
propio, inventados. Cada uno es una tabla de color tridimensional
almacenada como tira bidimensional de 512 por 512 píxeles, más un conjunto
de valores por defecto para grano y textura.

Cada carrete define su identidad: dominante de color, respuesta de
contraste, saturación y comportamiento en sombras. La captura de
referencia sugiere la variedad buscada: una instantánea cálida, una fría
de alto contraste, una en blanco y negro, una verdosa.

### 6.6 Estado y almacenamiento

El estado de edición es un objeto plano de parámetros con valores por
defecto conocidos. Se guarda en IndexedDB junto al Blob de la captura
original sin procesar. La edición es no destructiva: la original nunca se
modifica y se puede volver a abrir y seguir editando.

Deshacer y rehacer sobre la pila de cambios de parámetros, como muestran
las flechas de la cabecera de referencia.

### 6.7 Guardado

`navigator.share` con archivo cuando el dispositivo lo permita, que en iOS
es el camino que llega al carrete de fotos. Si no, descarga mediante
enlace con `download` sobre un object URL. La app comprueba cuál está
disponible, no lo supone.

Formato de salida JPEG con calidad alta, a la resolución de la captura.

### 6.8 Interfaz

Tema oscuro fijo, según la referencia. Acento amarillo para el elemento
activo y el botón de guardar. Controles de rango con el valor numérico
visible y regla de marcas, como el GRAIN de la captura.

Dos pantallas: cámara y editor. Sin enrutador; una máquina de estados
simple. Esto evita tener que configurar reescrituras en Vercel.

Gestos: deslizar horizontalmente sobre el carrete para cambiar de
película. Mantener pulsada la imagen en el editor para ver el original.

## 7. Verificación

- Pruebas unitarias sobre la lógica pura: conversión de parámetros,
  matemática de recorte y rotación, capa de almacenamiento, máquina de
  estados. Cobertura objetivo del 70 por ciento en esa lógica.
- Los shaders no se prueban por unidad. Se verifican con una imagen de
  referencia fija procesada con parámetros conocidos y comparada contra
  una salida esperada, con tolerancia.
- Comprobación manual en un dispositivo real antes de dar por buena la
  captura: es el único sitio donde se ve si el visor va fluido.
- La app debe arrancar, disparar, editar y guardar con el modo avión
  activado. Este es el criterio de éxito de la parte sin conexión.

## 8. Lo que queda al constructor

- La estructura exacta de carpetas y la división en módulos, respetando el
  límite de 400 líneas por archivo.
- La elección de librería de estado, si hace falta alguna más allá del
  estado propio de React.
- La generación concreta de las tablas de color de cada película y el
  ajuste fino de su aspecto.
- La implementación de cada shader y el ajuste de los rangos de cada
  control para que el extremo del recorrido sea útil y no absurdo.
- Cómo se dibujan los envases de los carretes.
- La fuente del sello de fecha, que debe ir embebida para funcionar sin
  conexión.
- El orden de construcción y el desglose en fases.

## 9. Decisiones tomadas tras la revisión

Huecos que detectó la revisión del documento, resueltos como decisiones de
diseño. Todas son del autor del documento, no acordadas con el usuario.

**9.1 Vista previa durante la edición.** Existe un tercer recorrido: el
editor procesa el recorrido completo sobre una copia reducida de la
captura, con el lado mayor limitado al tamaño de pantalla por el factor de
píxel. Se acepta que no es idéntico pixel a pixel al archivo exportado.
Para que la diferencia no se note, todo shader cuyo efecto dependa de la
escala (grano, viñeteado, aberración, halación, desenfoque de bordes,
superposiciones) se parametriza en un espacio de referencia normalizado y
no en píxeles de salida. La exportación limita el lado mayor a 4096
píxeles.

**9.2 Pantalla de cámara.** Visor a pantalla completa recortando la pista
para llenarla, y la captura se recorta al mismo encuadre que se vio: lo
encuadrado es lo capturado. Lleva el mismo carrete horizontal que el
editor, un control de exposición, disparador centrado y botón de cambio
entre cámara frontal y trasera. La película y la exposición elegidas en el
visor pasan al editor como estado inicial.

**9.3 Capturas pendientes.** Una sola a la vez. Tras disparar se entra
siempre al editor. Cerrar con la X pide confirmación y descarta. Guardar
no borra la captura: como `navigator.share` no informa de si el usuario
llegó a guardarla, la pendiente se conserva hasta el siguiente disparo.

**9.4 Criterio de rendimiento y matriz de soporte.** El visor debe
sostener 30 fotogramas por segundo en un iPhone 11 y en un Android de
gama media de 2021. Soporte: Safari en iOS 14.3 o superior y Chrome en
Android 90 o superior. WebGL 1, sin framebuffers de coma flotante. Plan B
si no se alcanza: bajar la resolución del visor antes que quitar la tabla
de color.

**9.5 Reducción de resolución.** Sí se acepta. La captura se reduce a
`MAX_TEXTURE_SIZE` del dispositivo cuando lo supere, manteniendo la
proporción y sin avisar al usuario.

**9.6 Texturas de efectos.** Generadas por procedimiento con un script
propio que escribe las imágenes al repositorio. No se usan recursos de
terceros: evita la cuestión de licencia y mantiene el peso bajo control.

**9.7 Pruebas de imagen de los shaders.** Vitest en modo navegador con
Chromium de Playwright, ejecución local, fuera del camino del despliegue.
La salida esperada la genera la propia implementación, así que la prueba
detecta regresiones y no corrección; tolerancia de 3 sobre 255.

**9.8 Cambio de carrete.** Cada parámetro con valor por defecto propio de
la película recuerda si el usuario lo ha tocado. Al cambiar de carrete se
sobrescriben solo los que no ha tocado.

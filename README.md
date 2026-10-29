# Raw Camara

Camara de pelicula simulada que funciona como aplicacion web instalable.
Captura con la camara del dispositivo, previsualiza el carrete en vivo y
revela la foto con cinco grupos de ajustes antes de guardarla. Todo el
procesado ocurre en el telefono: no hay servidor ni envio de imagenes.

## Caracteristicas

- 54 carretes de color propios, agrupados en seis familias.
- Cinco grupos de ajustes: LIGHT, FILM, OPTICS, EFFECTS y CROP.
- Procesado en WebGL, con visor en vivo y revelado a resolucion nativa.
- Funciona sin conexion una vez instalada.
- Las capturas sin guardar se conservan entre sesiones.

## Requisitos

- Node 20 o superior.
- pnpm 9 o superior.
- Navegador con WebGL y acceso a camara sobre HTTPS. En iOS hace falta
  la version 14.3 o superior para capturar dentro de la aplicacion
  instalada.

## Instalacion

```bash
pnpm install
```

## Ejecucion

```bash
pnpm dev        # servidor de desarrollo
pnpm build      # construccion de produccion
pnpm preview    # servir la construccion
```

La camara necesita un origen seguro. `localhost` cuenta como tal; desde
otro dispositivo de la red hace falta HTTPS.

## Pruebas

```bash
pnpm test       # logica pura, en Node
pnpm test:gl    # shaders y revelado, en Chromium real
```

Las pruebas de shader comparan el resultado contra valores conocidos con
tolerancia, por lo que detectan regresiones y no corrección absoluta.

## Recursos generados

Los iconos y las texturas de efectos se generan por procedimiento y se
versionan en el repositorio. No hay recursos de terceros.

```bash
pnpm icons      # iconos de la aplicacion
pnpm textures   # fugas de luz, polvo y destello
```

## Variables de entorno

Ninguna. La aplicacion no habla con ningun servicio.

## Despliegue

Sitio estatico. En Vercel se detecta Vite automaticamente y no hace falta
configuracion adicional.

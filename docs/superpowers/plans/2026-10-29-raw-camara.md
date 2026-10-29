# Raw Cámara - Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Una PWA instalable que captura fotos con la cámara del teléfono y las procesa con cinco grupos de ajustes de película simulada, funcionando sin conexión.

**Architecture:** React sobre Vite con dos pantallas (cámara y editor) gobernadas por una máquina de estados sin enrutador. El procesado de imagen vive en una canalización WebGL de pasos encadenados sobre framebuffers; el visor en vivo ejecuta un recorrido corto a resolución de pantalla y la captura ejecuta el recorrido completo a resolución nativa. El estado de edición es un objeto plano de parámetros con pila de deshacer, y la captura original se conserva en IndexedDB para que la edición sea no destructiva.

**Tech Stack:** React 19, TypeScript, Vite 7, vite-plugin-pwa (Workbox), WebGL1, idb, Vitest (nodo y modo navegador con Playwright).

**Spec:** `docs/superpowers/specs/2026-10-29-raw-camara-design.md`

## Global Constraints

- Sin emojis ni iconografía en código, comentarios ni documentación.
- Ningún archivo por encima de 400 líneas.
- Identificadores y comentarios de código en inglés; etiquetas de interfaz en inglés, tal como aparecen en la referencia (LIGHT, FILM, OPTICS, EFFECTS, CROP, GRAIN, Save); mensajes de error al usuario en español; mensajes de commit en español con prefijo convencional.
- Prohibido usar nombres, logotipos o envases de marcas reales de película.
- Sin backend, sin credenciales en el código, sin peticiones de red en tiempo de ejecución.
- Presupuesto de precarga del service worker: objetivo por debajo de 12 MB, máximo duro 20 MB.
- iOS 14.3 o superior para la captura dentro de la PWA instalada.
- La cabecera no muestra distintivo RAW.
- `npm` como gestor; nada de instalaciones globales.

## Review Focus

Clases de entrada que la especificación implica y que ninguna tarea ejercitaría por sí sola. Cada línea tiene su prueba asignada a la tarea que posee el código.

1. Permiso de cámara denegado, o cámara ocupada por otra aplicación: la app muestra una explicación accionable, no una pantalla negra. Prueba en Tarea 13.
2. Pérdida del contexto WebGL, que iOS provoca al volver de segundo plano: la canalización se reconstruye sin perder la captura en curso. Prueba en Tarea 6.
3. Captura mayor que `MAX_TEXTURE_SIZE` del dispositivo: se reescala antes de procesar en lugar de fallar. Prueba en Tarea 12.
4. IndexedDB no disponible o lleno, que es el caso de la navegación privada de Safari: la app sigue capturando y guardando, solo pierde la persistencia entre sesiones. Prueba en Tarea 4.
5. Cambio de orientación del dispositivo con una captura abierta: el recorte conserva su relación con la imagen y no se descuadra. Prueba en Tarea 3.

---

### Task 1: Andamiaje, PWA y arranque de pruebas

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/ui/App.css`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-512.png`
- Test: `src/app.test.ts`

**Interfaces:**
- Produces: proyecto que construye con `npm run build` y prueba con `npm test`; `vite.config.ts` exporta la configuración con `VitePWA` en modo `generateSW`, `registerType: 'autoUpdate'`, `manifest.display: 'standalone'`, `manifest.orientation: 'portrait'`, `manifest.background_color` y `theme_color` en `#000000`.

- [ ] **Step 1: Escribir la prueba que falla**

```ts
// src/app.test.ts
import { readFileSync } from 'node:fs'
test('el manifiesto declara modo standalone y tema oscuro', () => {
  const config = readFileSync('vite.config.ts', 'utf8')
  expect(config).toContain("display: 'standalone'")
  expect(config).toContain("theme_color: '#000000'")
})
```

- [ ] **Step 2: Ejecutar y comprobar que falla**

Run: `npm test -- src/app.test.ts`
Expected: FAIL, el archivo `vite.config.ts` no existe.

- [ ] **Step 3: Crear el proyecto**

`npm create vite@latest . -- --template react-ts`, luego `npm i -D vite-plugin-pwa vitest @vitest/browser playwright` y `npm i idb`. Añadir a `package.json` los scripts `dev`, `build`, `preview`, `test` (`vitest run`) y `test:gl` (`vitest run --browser.enabled --browser.name=chromium`). Los iconos son placas de color sólido con el logotipo del proyecto; se refinan en la Tarea 19.

- [ ] **Step 4: Ejecutar y comprobar que pasa**

Run: `npm test -- src/app.test.ts` y `npm run build`
Expected: PASS, y `dist/sw.js` presente tras la construcción.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: andamiaje de Vite, React y PWA"
```

---

### Task 2: Modelo de parámetros, valores por defecto y deshacer

**Files:**
- Create: `src/types.ts`, `src/state/params.ts`, `src/state/history.ts`
- Test: `src/state/params.test.ts`, `src/state/history.test.ts`

**Interfaces:**
- Produces:
  - `type EditParams` con los grupos `light`, `film`, `optics`, `effects`, `crop`. `light`: `exposure`, `contrast`, `highlights`, `shadows`, `temperature`, `tint`, `saturation`, todos `number` en el rango -100 a 100 salvo donde se indique. `film`: `filmId: string`, `grainAmount`, `grainSize`, `texture`, `develop` (pasos, -2 a 2). `optics`: `focalMm: 24|28|35|50|85`, `vignette`, `chromatic`, `edgeBlur`. `effects`: `lightLeak`, `halation`, `dust`, `flare`, `dateStamp: boolean`. `crop`: `aspect: '1:1'|'4:3'|'3:2'|'16:9'|'free'`, `rotation: number` en grados, `mirror: boolean`, `rect: CropRect`.
  - `const DEFAULT_PARAMS: EditParams`, con todos los valores numéricos a 0, `focalMm` 35, `aspect` `'free'`, `dateStamp` falso.
  - `function isDefault(params: EditParams): boolean`
  - `class History<T>` con `push(state: T): void`, `undo(): T | null`, `redo(): T | null`, `canUndo: boolean`, `canRedo: boolean`, límite de 50 entradas.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('los valores por defecto dejan la imagen sin alterar', () => {
  expect(DEFAULT_PARAMS.optics.focalMm).toBe(35)
  expect(DEFAULT_PARAMS.light.exposure).toBe(0)
  expect(isDefault(DEFAULT_PARAMS)).toBe(true)
})

test('deshacer devuelve el estado anterior y rehacer lo recupera', () => {
  const h = new History(DEFAULT_PARAMS)
  h.push(withExposure(10)); h.push(withExposure(20))
  expect(h.undo()).toEqual(withExposure(10))
  expect(h.redo()).toEqual(withExposure(20))
})

test('un cambio nuevo descarta la rama de rehacer', () => {
  const h = new History(DEFAULT_PARAMS)
  h.push(withExposure(10)); h.undo(); h.push(withExposure(30))
  expect(h.canRedo).toBe(false)
})

test('la pila se limita a 50 entradas', () => { /* empujar 60, comprobar que el deshacer más profundo no llega al estado inicial */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/state`
Expected: FAIL, módulos no encontrados.

- [ ] **Step 3: Implementar `src/types.ts`, `src/state/params.ts` y `src/state/history.ts`**

`History` guarda estados completos, no diferencias: el objeto de parámetros es pequeño y copiarlo entero evita toda una clase de errores.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/state`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/state
git commit -m "feat: modelo de parametros de edicion con deshacer y rehacer"
```

---

### Task 3: Geometría de recorte

**Files:**
- Create: `src/crop/geometry.ts`
- Test: `src/crop/geometry.test.ts`

**Interfaces:**
- Produces:
  - `type CropRect = { x: number; y: number; w: number; h: number }`, en fracciones de 0 a 1 relativas a la imagen, nunca en píxeles.
  - `function fitAspect(rect: CropRect, aspect: Aspect, imageAspect: number): CropRect`, devuelve el rectángulo mayor con esa proporción centrado en el actual y contenido en la imagen.
  - `function clampRect(rect: CropRect): CropRect`
  - `function outputSize(image: {w: number; h: number}, rect: CropRect, rotation: number): {w: number; h: number}`
  - `function rotatedBounds(w: number, h: number, degrees: number): {w: number; h: number}`

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('fitAspect produce la proporción pedida', () => {
  const r = fitAspect({x:0,y:0,w:1,h:1}, '1:1', 1500/1000)
  expect(r.w * 1500).toBeCloseTo(r.h * 1000, 3)
})

test('el rectángulo en fracciones sobrevive al cambio de orientación', () => {
  const r = fitAspect({x:0,y:0,w:1,h:1}, '16:9', 1000/1500)
  expect(clampRect(r)).toEqual(r)
  expect(r.x).toBeGreaterThanOrEqual(0)
  expect(r.y + r.h).toBeLessThanOrEqual(1)
})

test('rotar 90 grados intercambia los lados del encuadre', () => {
  expect(rotatedBounds(100, 50, 90)).toEqual({ w: 50, h: 100 })
})

test('clampRect devuelve un rectángulo dentro de la imagen', () => { /* entrada fuera de rango por los cuatro lados */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/crop`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/crop/geometry.ts`**

Las coordenadas en fracciones son la decisión que resuelve el punto 5 de Review Focus: al girar el dispositivo cambia el tamaño en píxeles del lienzo, no el rectángulo.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/crop`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/crop
git commit -m "feat: matematica de recorte y rotacion"
```

---

### Task 4: Almacenamiento en IndexedDB

**Files:**
- Create: `src/storage/db.ts`
- Test: `src/storage/db.test.ts`

**Interfaces:**
- Consumes: `EditParams` de la Tarea 2.
- Produces:
  - `type Shot = { id: string; createdAt: number; original: Blob; params: EditParams }`
  - `async function saveShot(shot: Shot): Promise<void>`
  - `async function loadShots(): Promise<Shot[]>`, ordenadas de más reciente a más antigua.
  - `async function deleteShot(id: string): Promise<void>`
  - `async function isPersistenceAvailable(): Promise<boolean>`

  Ninguna de estas funciones lanza: si IndexedDB no está disponible, `saveShot` y `deleteShot` no hacen nada, `loadShots` devuelve `[]` y `isPersistenceAvailable` devuelve falso.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// con fake-indexeddb
test('guardar y recuperar conserva los parámetros y el blob', async () => { /* ida y vuelta */ })

test('loadShots devuelve las capturas de más reciente a más antigua', async () => { /* tres con createdAt distinto */ })

test('sin IndexedDB la app no se rompe', async () => {
  vi.stubGlobal('indexedDB', undefined)
  await expect(saveShot(aShot)).resolves.toBeUndefined()
  await expect(loadShots()).resolves.toEqual([])
  await expect(isPersistenceAvailable()).resolves.toBe(false)
})

test('una cuota excedida al guardar no propaga el error', async () => { /* simular QuotaExceededError */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/storage`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/storage/db.ts`**

Usar `idb`. Una sola base `raw-camara`, versión 1, almacén `shots` con clave `id` e índice sobre `createdAt`.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/storage`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/storage
git commit -m "feat: persistencia de capturas en IndexedDB"
```

---

### Task 5: Guardado en el dispositivo

**Files:**
- Create: `src/export/save.ts`
- Test: `src/export/save.test.ts`

**Interfaces:**
- Produces:
  - `function supportsFileShare(file: File): boolean`, envuelve `navigator.canShare`.
  - `async function saveImage(blob: Blob, filename: string): Promise<'shared' | 'downloaded'>`
  - `function shotFilename(createdAt: number): string`, con formato `RAW_YYYYMMDD_HHMMSS.jpg`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('usa compartir cuando el dispositivo lo permite', async () => {
  const share = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { share, canShare: () => true })
  await expect(saveImage(blob, 'a.jpg')).resolves.toBe('shared')
  expect(share).toHaveBeenCalled()
})

test('cae a la descarga cuando no hay compartir de archivos', async () => {
  vi.stubGlobal('navigator', {})
  await expect(saveImage(blob, 'a.jpg')).resolves.toBe('downloaded')
})

test('cancelar la hoja de compartir no se trata como fallo', async () => {
  const share = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }))
  vi.stubGlobal('navigator', { share, canShare: () => true })
  await expect(saveImage(blob, 'a.jpg')).resolves.toBe('shared')
})

test('shotFilename rellena con ceros', () => {
  expect(shotFilename(Date.UTC(2026, 0, 2, 3, 4, 5))).toMatch(/^RAW_20260102_030405\.jpg$/)
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/export`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/export/save.ts`**

`shotFilename` usa la hora local, no UTC; la prueba construye su valor esperado con la misma conversión.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/export`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/export
git commit -m "feat: guardado mediante compartir o descarga"
```

---

### Task 6: Núcleo WebGL

**Files:**
- Create: `src/gl/context.ts`, `src/gl/program.ts`, `src/gl/pipeline.ts`, `src/gl/shaders/quad.vert.ts`
- Test: `src/gl/pipeline.browser.test.ts`

**Interfaces:**
- Produces:
  - `function createContext(canvas: HTMLCanvasElement): WebGLRenderingContext`, lanza `GLUnavailableError` si no hay contexto.
  - `function createProgram(gl, fragmentSource: string): WebGLProgram`, el vértice siempre es el cuadrilátero de pantalla completa.
  - `class Pipeline` con `constructor(gl)`, `setSource(source: TexImageSource | WebGLTexture, w: number, h: number)`, `addPass(program: WebGLProgram, uniforms: Record<string, number | number[] | WebGLTexture>)`, `render(): void`, `readBlob(quality: number): Promise<Blob>`, `dispose(): void`.
  - `Pipeline` usa dos framebuffers alternos; el último paso dibuja al lienzo.
  - `function onContextLost(canvas, handler: () => void): () => void`

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
// modo navegador
test('un paso de identidad devuelve el píxel original', async () => {
  // fuente de un solo color, paso que copia, leer el píxel central
  expect(readPixel(canvas, 0, 0)).toEqual([18, 52, 86, 255])
})

test('dos pasos se encadenan en orden', async () => {
  // paso A suma 0.1 al rojo, paso B lo duplica; el resultado prueba el orden
})

test('la pérdida de contexto dispara el manejador y dispose no lanza', async () => {
  const spy = vi.fn()
  onContextLost(canvas, spy)
  canvas.getContext('webgl').getExtension('WEBGL_lose_context').loseContext()
  await waitFor(() => expect(spy).toHaveBeenCalled())
  expect(() => pipeline.dispose()).not.toThrow()
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm run test:gl -- src/gl`
Expected: FAIL.

- [ ] **Step 3: Implementar el núcleo**

Texturas con `NEAREST` y `CLAMP_TO_EDGE`; precisión `mediump` en los fragmentos, que es lo que garantiza WebGL1 en móvil. `readBlob` usa `canvas.toBlob` con tipo `image/jpeg`.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm run test:gl -- src/gl`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gl
git commit -m "feat: nucleo WebGL con pasos encadenados"
```

---

### Task 7: Catálogo de películas y tablas de color

**Files:**
- Create: `src/films/catalog.ts`, `src/films/lut.ts`, `src/gl/shaders/film.frag.ts`, `scripts/generate-luts.mjs`
- Create: `public/textures/luts/*.png`
- Test: `src/films/catalog.test.ts`, `src/films/lut.browser.test.ts`

**Interfaces:**
- Produces:
  - `type Film = { id: string; name: string; lut: string; defaults: { grainAmount: number; grainSize: number; texture: number }; canister: { body: string; label: string; text: string } }`
  - `const FILMS: Film[]`, seis entradas con identificadores `nova`, `steel`, `instant`, `mono`, `verde`, `amber`.
  - `async function loadLut(gl, url: string): Promise<WebGLTexture>`, con caché por url.
  - `filmFragment`: muestreo de tabla tridimensional sobre tira de 512 por 512, con 64 celdas de 64 por 64, interpolación entre las dos celdas de azul vecinas, y uniforme `uIntensity`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('el catálogo tiene identificadores únicos y ningún nombre de marca real', () => {
  const ids = FILMS.map(f => f.id)
  expect(new Set(ids).size).toBe(ids.length)
  const banned = ['kodak','fuji','ilford','portra','velvia','tri-x','polaroid','agfa','cinestill']
  for (const f of FILMS) expect(banned).not.toContain(f.name.toLowerCase())
})

test('toda película declara una tabla existente', () => { /* comprobar que el archivo está en public */ })

// modo navegador
test('la tabla neutra deja la imagen igual', async () => {
  // aplicar la tabla identidad generada por el script; cada canal debe volver con tolerancia de 2
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/films` y `npm run test:gl -- src/films`
Expected: FAIL.

- [ ] **Step 3: Implementar el catálogo, el muestreo y el generador**

`scripts/generate-luts.mjs` escribe las tiras a partir de una descripción declarativa por película: curva por canal, desplazamiento de sombras, saturación y dominante. El script se ejecuta a mano y su salida se versiona, de forma que la construcción no dependa de él.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `node scripts/generate-luts.mjs && npm test -- src/films && npm run test:gl -- src/films`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/films src/gl/shaders/film.frag.ts scripts public/textures
git commit -m "feat: catalogo de peliculas y tablas de color"
```

---

### Task 8: Pasos de LIGHT

**Files:**
- Create: `src/gl/shaders/light.frag.ts`
- Test: `src/gl/shaders/light.browser.test.ts`

**Interfaces:**
- Produces: `lightFragment`, con uniformes `uExposure`, `uContrast`, `uHighlights`, `uShadows`, `uTemperature`, `uTint`, `uSaturation`, todos normalizados de -1 a 1 por el llamante.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('todos los uniformes a cero dejan el píxel igual', async () => { /* tolerancia de 1 por canal */ })
test('la exposición a uno aclara sin saturar el blanco a negro', async () => { /* gris medio sube, blanco sigue blanco */ })
test('la saturación a menos uno deja los tres canales iguales', async () => { /* un rojo saturado sale gris */ })
test('las altas luces no tocan las sombras', async () => { /* píxel oscuro invariante con uHighlights a uno */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm run test:gl -- src/gl/shaders/light`
Expected: FAIL.

- [ ] **Step 3: Implementar `lightFragment`**

Exposición como multiplicación en lineal, contraste como pivote en 0.5, altas luces y sombras con máscaras suaves por luminancia, temperatura y tinte como desplazamiento de canales, saturación mezclando contra la luminancia. La luminancia es `dot(rgb, vec3(0.2126, 0.7152, 0.0722))` en todos los shaders del proyecto.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm run test:gl -- src/gl/shaders/light`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gl/shaders/light.frag.ts
git commit -m "feat: ajustes de luz en shader"
```

---

### Task 9: Pasos de OPTICS

**Files:**
- Create: `src/gl/shaders/optics.frag.ts`, `src/gl/shaders/edgeblur.frag.ts`, `src/optics/focal.ts`
- Test: `src/optics/focal.test.ts`, `src/gl/shaders/optics.browser.test.ts`

**Interfaces:**
- Produces:
  - `function focalTransform(focalMm: number): { zoom: number; barrel: number }`, con 35 devolviendo `{ zoom: 1, barrel: 0 }`.
  - `opticsFragment`, uniformes `uZoom`, `uBarrel`, `uVignette`, `uChromatic`.
  - `edgeBlurFragment`, uniformes `uAmount`, `uTexel`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('35 mm es la base sin alterar', () => {
  expect(focalTransform(35)).toEqual({ zoom: 1, barrel: 0 })
})
test('por debajo de 35 hay barril y por encima hay recorte', () => {
  expect(focalTransform(24).barrel).toBeGreaterThan(0)
  expect(focalTransform(85).zoom).toBeGreaterThan(1)
})
// modo navegador
test('el viñeteado oscurece la esquina y respeta el centro', async () => { /* comparar esquina y centro */ })
test('la aberración cromática separa los canales en los bordes, no en el centro', async () => { /* borde de alto contraste */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/optics && npm run test:gl -- src/gl/shaders/optics`
Expected: FAIL.

- [ ] **Step 3: Implementar**

La distorsión y el zoom se aplican sobre la coordenada de muestreo, en el primer paso de la canalización, antes de cualquier ajuste tonal. El desenfoque de bordes es un paso aparte porque necesita varias muestras.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/optics && npm run test:gl -- src/gl/shaders/optics`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/optics src/gl/shaders/optics.frag.ts src/gl/shaders/edgeblur.frag.ts
git commit -m "feat: optica simulada, focal, vineteado y aberracion"
```

---

### Task 10: Grano y textura

**Files:**
- Create: `src/gl/shaders/grain.frag.ts`
- Test: `src/gl/shaders/grain.browser.test.ts`

**Interfaces:**
- Produces: `grainFragment`, uniformes `uAmount`, `uSize`, `uTexture`, `uSeed`, `uResolution`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('cantidad cero no cambia nada', async () => { /* tolerancia de 1 */ })
test('el grano es más visible en los tonos medios que en el blanco puro', async () => { /* desviación por zona */ })
test('el tamaño del grano no depende de la resolución de salida', async () => {
  // misma semilla y tamaño a 512 y a 1024; la desviación estándar relativa se mantiene
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm run test:gl -- src/gl/shaders/grain`
Expected: FAIL.

- [ ] **Step 3: Implementar `grainFragment`**

Ruido por función de dispersión sobre la coordenada dividida por `uSize`, en un espacio de referencia fijo y no en píxeles de salida: es lo que hace que el grano se vea igual en el visor y en la exportación. Modulado por una máscara que decae hacia el blanco y el negro.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm run test:gl -- src/gl/shaders/grain`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gl/shaders/grain.frag.ts
git commit -m "feat: grano de pelicula independiente de la resolucion"
```

---

### Task 11: Efectos y sello de fecha

**Files:**
- Create: `src/gl/shaders/halation.frag.ts`, `src/gl/shaders/overlay.frag.ts`, `src/effects/overlays.ts`, `src/effects/datestamp.ts`
- Create: `public/textures/overlays/leak-*.jpg`, `public/textures/overlays/dust.png`, `public/textures/overlays/flare.png`
- Create: `public/fonts/datestamp.woff2`
- Test: `src/effects/datestamp.test.ts`, `src/gl/shaders/effects.browser.test.ts`

**Interfaces:**
- Produces:
  - `halationFragment`, uniformes `uAmount`, `uTexel`, `uThreshold`; difusión de altas luces con dominante cálida.
  - `overlayFragment`, uniformes `uOverlay`, `uAmount`, `uBlend` (0 pantalla, 1 multiplicar).
  - `async function loadOverlays(gl): Promise<OverlayTextures>`
  - `function stampText(createdAt: number): string`, formato `DD MM 'YY HH:MM`.
  - `function drawDateStamp(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): void`, naranja `#ff7a18`, esquina inferior derecha, tamaño proporcional al lado menor.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('el sello usa el formato de fecha de la referencia', () => {
  expect(stampText(new Date(2026, 9, 29, 17, 23).getTime())).toBe("29 10 '26 17:23")
})
test('el sello se dibuja dentro del lienzo', () => { /* medir el texto y comprobar márgenes */ })
// modo navegador
test('la halación tiñe alrededor de una alta luz y no el fondo oscuro', async () => { /* punto blanco sobre negro */ })
test('intensidad cero en una superposición deja la imagen igual', async () => { /* tolerancia de 1 */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/effects && npm run test:gl -- src/gl/shaders/effects`
Expected: FAIL.

- [ ] **Step 3: Implementar**

El sello se dibuja en canvas 2D sobre el resultado ya recortado, no en shader: necesita texto y es el último paso. La fuente va embebida en `public/fonts` y declarada en el precache para que funcione sin conexión. Las superposiciones son tres fugas de luz, una de polvo y una de destello, en resolución 1024 y comprimidas por debajo de 200 KB cada una.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/effects && npm run test:gl -- src/gl/shaders/effects`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/effects src/gl/shaders public/textures/overlays public/fonts
git commit -m "feat: halacion, superposiciones y sello de fecha"
```

---

### Task 12: Canalización completa

**Files:**
- Create: `src/gl/render.ts`
- Test: `src/gl/render.browser.test.ts`

**Interfaces:**
- Consumes: `Pipeline` (T6), todos los fragmentos (T7 a T11), `EditParams` (T2), `outputSize` (T3), `drawDateStamp` (T11).
- Produces:
  - `const MAX_DIMENSION_FALLBACK = 4096`
  - `function fitToTextureLimit(gl, w: number, h: number): { w: number; h: number }`, reduce manteniendo la proporción hasta `MAX_TEXTURE_SIZE`.
  - `async function renderFull(source: ImageBitmap, params: EditParams): Promise<Blob>`, ejecuta los nueve pasos en el orden de la especificación y devuelve JPEG de calidad 0.92.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('los parámetros por defecto devuelven una imagen equivalente a la original', async () => { /* tolerancia de 3 por canal, la compresión JPEG mueve algo */ })
test('una imagen mayor que el límite de textura se reescala en lugar de fallar', async () => {
  const limited = fakeGlWithMaxTexture(1024)
  expect(fitToTextureLimit(limited, 6000, 4000)).toEqual({ w: 1024, h: 683 })
})
test('una captura de 6000 por 4000 se procesa y devuelve un blob no vacío', async () => { /* no lanza, tamaño mayor que cero */ })
test('el recorte se aplica después del grano', async () => { /* el grano del borde recortado no aparece en la salida */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm run test:gl -- src/gl/render`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/gl/render.ts`**

Orden fijo: óptica geométrica, luz, película, halación, aberración y viñeteado y desenfoque de bordes, grano, superposiciones, recorte, sello. Los pasos cuyo parámetro vale cero se omiten; es la optimización que mantiene corta la canalización en el caso normal.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm run test:gl -- src/gl/render`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gl/render.ts
git commit -m "feat: canalizacion completa de revelado"
```

---

### Task 13: Cámara y captura

**Files:**
- Create: `src/camera/useCamera.ts`, `src/camera/capture.ts`
- Test: `src/camera/useCamera.test.ts`, `src/camera/capture.test.ts`

**Interfaces:**
- Produces:
  - `type CameraError = 'denied' | 'busy' | 'unsupported' | 'none'`
  - `function cameraErrorFrom(error: unknown): CameraError`, mapea `NotAllowedError` a `denied`, `NotReadableError` y `TrackStartError` a `busy`, la ausencia de `mediaDevices` a `unsupported`.
  - `const CAMERA_MESSAGES: Record<CameraError, string>`, en español, cada uno diciendo qué hacer.
  - `function useCamera(): { stream, facing, error: CameraError, flip(): void, retry(): void }`
  - `async function capture(stream: MediaStream, video: HTMLVideoElement): Promise<ImageBitmap>`, usa `ImageCapture.takePhoto` cuando exista y cae al fotograma del vídeo si no.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('el permiso denegado se traduce a un mensaje accionable', () => {
  expect(cameraErrorFrom(Object.assign(new Error(), { name: 'NotAllowedError' }))).toBe('denied')
  expect(CAMERA_MESSAGES.denied).toMatch(/permiso/i)
})
test('la cámara ocupada por otra aplicación se distingue del permiso denegado', () => {
  expect(cameraErrorFrom(Object.assign(new Error(), { name: 'NotReadableError' }))).toBe('busy')
})
test('un navegador sin mediaDevices se reporta como no soportado', () => { /* stub de navigator sin mediaDevices */ })
test('capture cae al fotograma del vídeo cuando no hay ImageCapture', async () => {
  vi.stubGlobal('ImageCapture', undefined)
  await expect(capture(fakeStream, fakeVideo)).resolves.toBeInstanceOf(ImageBitmap)
})
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/camera`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`useCamera` pide `facingMode: 'environment'` con `width` y `height` ideales de 4096 por 4096, que el navegador recorta a lo que tenga. Detiene las pistas al desmontar y al cambiar de cámara.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/camera`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/camera
git commit -m "feat: acceso a camara y captura de fotograma"
```

---

### Task 14: Visor en vivo

**Files:**
- Create: `src/gl/preview.ts`
- Test: `src/gl/preview.browser.test.ts`

**Interfaces:**
- Consumes: `Pipeline` (T6), `filmFragment` (T7), `lightFragment` (T8).
- Produces: `class PreviewRenderer` con `constructor(canvas)`, `start(video: HTMLVideoElement)`, `setFilm(film: Film)`, `setExposure(value: number)`, `stop()`, `fps: number`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('el visor solo encadena película y exposición', () => {
  expect(new PreviewRenderer(canvas).passCount).toBe(2)
})
test('renderiza al tamaño del lienzo, no al del vídeo', async () => { /* vídeo 4000x3000, lienzo 390x844 */ })
test('stop cancela el bucle de animación', async () => { /* contar fotogramas tras parar */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm run test:gl -- src/gl/preview`
Expected: FAIL.

- [ ] **Step 3: Implementar `src/gl/preview.ts`**

Bucle con `requestAnimationFrame`, resubiendo la textura del vídeo cada fotograma. El lienzo se dimensiona a `devicePixelRatio` limitado a 2.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm run test:gl -- src/gl/preview`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gl/preview.ts
git commit -m "feat: visor en vivo con pelicula y exposicion"
```

---

### Task 15: Controles de interfaz compartidos

**Files:**
- Create: `src/ui/RulerSlider.tsx`, `src/ui/TabBar.tsx`, `src/ui/FilmStrip.tsx`, `src/ui/Header.tsx`, `src/ui/theme.css`
- Test: `src/ui/RulerSlider.test.tsx`, `src/ui/FilmStrip.test.tsx`

**Interfaces:**
- Produces:
  - `RulerSlider` con props `label`, `value`, `min`, `max`, `onChange`; muestra el valor numérico junto a la etiqueta y una regla de marcas.
  - `TabBar` con props `tabs: readonly string[]`, `active`, `onSelect`.
  - `FilmStrip` con props `films`, `selectedId`, `onSelect`; desplazamiento horizontal con ajuste a posición.
  - `Header` con props `onClose`, `onUndo`, `onRedo`, `canUndo`, `canRedo`, `time: string`, `onMore`, `onSave`.
  - `theme.css` define `--bg: #000`, `--accent: #ffd60a`, `--text: #fff`, `--muted: #8a8a8e`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('el control muestra su etiqueta y su valor', () => {
  render(<RulerSlider label="GRAIN" value={15} min={0} max={100} onChange={()=>{}} />)
  expect(screen.getByText('GRAIN')).toBeVisible()
  expect(screen.getByText('15')).toBeVisible()
})
test('el control no deja salirse del rango', () => { /* arrastrar más allá del máximo */ })
test('la tira marca la película activa', () => { /* aria-selected en la elegida */ })
test('deshacer está deshabilitado cuando no hay historia', () => { /* canUndo falso */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/ui`
Expected: FAIL.

- [ ] **Step 3: Implementar los controles**

Los envases de los carretes se dibujan en SVG dentro de `FilmStrip`, con los colores que declara cada `Film.canister`. El área táctil mínima de cualquier control es de 44 píxeles.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/ui`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "feat: controles compartidos de interfaz"
```

---

### Task 16: Pantalla de cámara

**Files:**
- Create: `src/ui/CameraScreen.tsx`
- Modify: `src/App.tsx`
- Test: `src/ui/CameraScreen.test.tsx`

**Interfaces:**
- Consumes: `useCamera`, `capture` (T13), `PreviewRenderer` (T14), `FilmStrip` (T15), `FILMS` (T7).
- Produces: `CameraScreen` con prop `onCaptured(bitmap: ImageBitmap, filmId: string): void`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('con permiso denegado muestra el mensaje y el botón de reintentar, no el visor', () => { /* consultar por texto */ })
test('el disparador entrega la captura y la película elegida', async () => { /* onCaptured llamado con el id activo */ })
test('voltear la cámara reinicia el flujo', async () => { /* getUserMedia llamado de nuevo con facingMode user */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/ui/CameraScreen`
Expected: FAIL.

- [ ] **Step 3: Implementar `CameraScreen`**

Lienzo a pantalla completa con el visor, tira de películas sobre el borde inferior, disparador centrado, botón de voltear a un lado.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/ui/CameraScreen`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/CameraScreen.tsx src/App.tsx
git commit -m "feat: pantalla de camara con visor y disparador"
```

---

### Task 17: Editor y sus cinco paneles

**Files:**
- Create: `src/ui/EditorScreen.tsx`, `src/ui/panels/LightPanel.tsx`, `src/ui/panels/FilmPanel.tsx`, `src/ui/panels/OpticsPanel.tsx`, `src/ui/panels/EffectsPanel.tsx`
- Test: `src/ui/EditorScreen.test.tsx`, `src/ui/panels/panels.test.tsx`

**Interfaces:**
- Consumes: `EditParams`, `History` (T2), `renderFull` (T12), controles (T15).
- Produces: `EditorScreen` con props `source: ImageBitmap`, `initialParams: EditParams`, `onClose()`, `onSaved()`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('las cinco pestañas están presentes en el orden de la referencia', () => {
  expect(tabs()).toEqual(['LIGHT','FILM','OPTICS','EFFECTS','CROP'])
})
test('mover un control de LIGHT apila un paso de deshacer', async () => { /* deshacer vuelve al valor previo */ })
test('FILM muestra los tres submodos: grano, textura y revelado', () => { /* tres botones */ })
test('OPTICS ofrece las cinco focales con 35 mm por defecto', () => { /* 35 mm activo */ })
test('EFFECTS conmuta el sello de fecha', async () => { /* aria-pressed cambia */ })
test('guardar llama a la canalización y después a saveImage', async () => { /* ambos espías llamados en orden */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/ui/EditorScreen src/ui/panels`
Expected: FAIL.

- [ ] **Step 3: Implementar el editor y cuatro paneles**

Cada panel es un archivo propio para respetar el límite de líneas. El editor rerenderiza la vista previa con una limitación de frecuencia de 60 milisegundos sobre una copia reducida de la captura, y solo usa la resolución nativa al guardar.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/ui/EditorScreen src/ui/panels`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/EditorScreen.tsx src/ui/panels
git commit -m "feat: editor con los paneles de luz, pelicula, optica y efectos"
```

---

### Task 18: Panel de recorte

**Files:**
- Create: `src/ui/panels/CropPanel.tsx`, `src/ui/CropOverlay.tsx`
- Test: `src/ui/panels/CropPanel.test.tsx`

**Interfaces:**
- Consumes: `fitAspect`, `clampRect` (T3).
- Produces: `CropPanel` con props `params`, `imageAspect`, `onChange`; `CropOverlay` con props `rect`, `rotation`, `onRectChange`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('elegir 1:1 ajusta el rectángulo a cuadrado', async () => { /* onChange con w*imageAspect == h */ })
test('el espejo es reversible', async () => { /* dos pulsaciones devuelven el valor inicial */ })
test('rotar y volver a cero deja el rectángulo intacto', async () => { /* igualdad estricta */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/ui/panels/CropPanel`
Expected: FAIL.

- [ ] **Step 3: Implementar**

La superposición dibuja la cuadrícula y los tiradores de esquina; el arrastre trabaja en fracciones y pasa por `clampRect` en cada movimiento.

- [ ] **Step 4: Ejecutar y comprobar que pasan**

Run: `npm test -- src/ui/panels/CropPanel`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/panels/CropPanel.tsx src/ui/CropOverlay.tsx
git commit -m "feat: panel de recorte con proporciones y rotacion"
```

---

### Task 19: Integración, sin conexión y despliegue

**Files:**
- Modify: `src/App.tsx`, `vite.config.ts`, `README.md`
- Create: `README.md`, `.gitignore`
- Test: `src/integration.test.ts`

**Interfaces:**
- Produces: aplicación completa; `App` enlaza cámara, editor y persistencia, y restaura la última captura sin guardar al arrancar.

- [ ] **Step 1: Escribir las pruebas que fallan**

```ts
test('una captura sin guardar se restaura al arrancar', async () => { /* sembrar IndexedDB, montar App, el editor aparece */ })
test('el precache declara las texturas y la fuente', () => {
  const config = readFileSync('vite.config.ts','utf8')
  expect(config).toMatch(/woff2/)
  expect(config).toMatch(/png,jpg/)
})
test('el paquete construido no contiene peticiones a dominios externos', () => { /* grep sobre dist buscando https:// de terceros */ })
```

- [ ] **Step 2: Ejecutar y comprobar que fallan**

Run: `npm test -- src/integration`
Expected: FAIL.

- [ ] **Step 3: Integrar y documentar**

`globPatterns` de Workbox incluye `**/*.{js,css,html,png,jpg,woff2}`. `README.md` cubre descripción, requisitos, instalación, ejecución y despliegue. `.gitignore` excluye `node_modules`, `dist`, `.env`, `.vercel` y los directorios de herramientas de asistencia.

- [ ] **Step 4: Verificar**

Run: `npm test && npm run test:gl && npm run build`
Expected: PASS, y el tamaño del precache impreso por el plugin por debajo de 12 MB.

Comprobación manual, que es la que decide: instalar desde el navegador del teléfono, activar modo avión, abrir, disparar, editar y guardar.

- [ ] **Step 5: Commit y despliegue**

```bash
git add -A
git commit -m "feat: integracion, funcionamiento sin conexion y documentacion"
git push -u origin main
```

Despliegue en Vercel desde el repositorio; Vite se detecta solo y no hace falta configuración adicional al no haber enrutador.

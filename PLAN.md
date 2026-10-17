# Plan de implementación: tetris-agent-demo

> **Instrucciones para el implementador:** sigue los pasos de la sección 5 en orden. No avances si el comando de verificación de un paso falla. No cambies las versiones de dependencias que ya están en `package.json`. No escribas código que no esté indicado en el paso en curso.

---

## 0. Restricciones y supuestos

- **Stack:** TypeScript, Vite, Canvas 2D. Sin frameworks de UI ni librerías de UI.
- **Versiones:** usa exactamente las versiones fijadas en `package.json` de la plantilla. Antes de empezar, ejecuta `npm ls vite typescript @playwright/test` y anota las versiones. Si `vitest` no está instalado, instálalo con una versión compatible con la versión mayor de Vite que ya esté fijada (`npm i -D vitest@<major compatible>`) y regístralo en el paso 0.
- **Lógica separada de la UI:** todo el motor del juego vive en `src/game/` y no toca el DOM ni `window`. Así las pruebas unitarias corren en Node.
- **Imagen de fondo:** el implementador no puede generar imágenes. Se genera fuera del flujo con la herramienta imagegen y se guarda en `assets/background.png`. Si el archivo no existe, la app debe seguir funcionando con un color de fondo sólido (ver paso 11).
- **Modo de prueba:** el hook `window.__seedBoard` solo se expone cuando `import.meta.env.MODE !== 'production'` o cuando la URL contiene `?test=1`. Así no queda expuesto en producción.
- **Aleatoriedad determinista:** la URL acepta `?seed=<entero>` para fijar la secuencia de piezas. Esto hace reproducibles las pruebas E2E.

---

## 1. Estructura de archivos

Los archivos marcados con **(existente)** ya vienen en la plantilla. Los marcados con **(nuevo)** hay que crearlos.

| Archivo | Estado | Responsabilidad |
|---|---|---|
| `index.html` | existente, modificar | Estructura: `<canvas>` del tablero, canvas de la siguiente pieza, marcador, botón "Iniciar", contenedor con imagen de fondo. |
| `src/main.ts` | existente, modificar | Punto de entrada. Crea el juego, conecta entrada, render, HUD y bucle `requestAnimationFrame`. Sin lógica de juego. |
| `src/style.css` | nuevo | Estilos: layout, fondo con `background.png`, fallback de color, estilo del botón. |
| `src/config.ts` | nuevo | Constantes: `COLS=10`, `ROWS=20`, tamaño de celda, tabla de velocidades, puntajes base. |
| `src/game/types.ts` | nuevo | Tipos compartidos: `PieceType`, `Matrix`, `Piece`, `Board`, `GameState`, `GameStatus`, `Action`. |
| `src/game/tetrominoes.ts` | nuevo | Matrices de las 7 piezas, colores y función de spawn. |
| `src/game/board.ts` | nuevo | Crear tablero, detectar colisiones, fusionar pieza al tablero, limpiar líneas. |
| `src/game/rotation.ts` | nuevo | Rotación de matriz en sentido horario y tablas de wall kicks. |
| `src/game/random.ts` | nuevo | PRNG con semilla (mulberry32) y generador "7-bag". |
| `src/game/scoring.ts` | nuevo | Puntaje por líneas, nivel a partir de líneas, intervalo de caída por nivel. |
| `src/game/engine.ts` | nuevo | Estado del juego y transiciones puras: `createGame`, `applyAction`, `tick`. |
| `src/render/renderer.ts` | nuevo | Dibuja tablero, pieza activa, pieza fantasma (opcional) y vista previa de la siguiente pieza. |
| `src/ui/input.ts` | nuevo | Traduce teclas a `Action` y previene el scroll de la página. |
| `src/ui/hud.ts` | nuevo | Actualiza en el DOM puntaje, nivel, líneas y estado (Jugando / Pausa / Game over). |
| `src/testing/hooks.ts` | nuevo | Expone `window.__seedBoard(rows)` y `window.__getState()` en modo de prueba. |
| `tests/unit/smoke.test.ts` | existente | Se mantiene hasta el paso 3; después se elimina. |
| `tests/unit/rotation.test.ts` | nuevo | Pruebas de rotación y wall kicks. |
| `tests/unit/collision.test.ts` | nuevo | Pruebas de colisiones y límites. |
| `tests/unit/lines.test.ts` | nuevo | Pruebas de limpieza de líneas. |
| `tests/unit/scoring.test.ts` | nuevo | Pruebas de puntaje, nivel y velocidad. |
| `tests/unit/random.test.ts` | nuevo | Pruebas del PRNG y del 7-bag. |
| `tests/unit/engine.test.ts` | nuevo | Pruebas de transiciones del motor (pausa, caída dura, game over). |
| `tests/e2e/smoke.spec.ts` | existente | Se actualiza para comprobar que la página carga y muestra "Iniciar". |
| `tests/e2e/game.spec.ts` | nuevo | Pruebas E2E: iniciar, mover, rotar, completar línea, game over. |
| `assets/background.png` | nuevo (manual) | Imagen de fondo generada con imagegen. |
| `assets/.gitkeep` | existente | Se conserva. |
| `package.json` | existente, modificar | Scripts `test:unit`, `test:e2e`, `typecheck`. |
| `vite.config.ts` | existente, modificar | Sin cambios de lógica; solo si hace falta `base` o alias. |
| `playwright.config.ts` | existente, modificar | `webServer` apunta al dev server de Vite; `baseURL` local. |
| `.github/workflows/ci.yml` | existente, modificar | Ejecuta `typecheck`, `test:unit`, `build` y `test:e2e`. |

---

## 2. Tipos y funciones públicas

Las firmas son el contrato. No cambies los nombres.

### `src/game/types.ts`
```ts
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Cell = number;               // 0 = vacío, 1..7 = id de color de pieza
export type Matrix = number[][];         // matriz cuadrada de la pieza (0 o id)
export type Board = Cell[][];            // ROWS filas × COLS columnas, board[y][x]
export interface Piece { type: PieceType; matrix: Matrix; x: number; y: number; }
export type GameStatus = 'idle' | 'playing' | 'paused' | 'over';
export type Action = 'left' | 'right' | 'rotate' | 'softDrop' | 'hardDrop' | 'togglePause' | 'start';
export interface GameState {
  board: Board;
  active: Piece | null;
  next: PieceType;
  bag: PieceType[];
  score: number;
  lines: number;
  level: number;
  status: GameStatus;
  gravityAccumMs: number;
  rngState: number;
}
```

### `src/game/tetrominoes.ts`
```ts
export const SHAPES: Record<PieceType, Matrix>;   // matrices 4x4 para I, 2x2 para O, 3x3 para el resto
export const COLOR_ID: Record<PieceType, number>; // 1..7
export function spawnPiece(type: PieceType): Piece; // x centrado, y = 0
```

### `src/game/board.ts`
```ts
export function createBoard(): Board;
export function collides(board: Board, piece: Piece, dx?: number, dy?: number, matrix?: Matrix): boolean;
export function merge(board: Board, piece: Piece): Board;               // devuelve copia nueva
export function clearLines(board: Board): { board: Board; cleared: number };
```

### `src/game/rotation.ts`
```ts
export function rotateMatrixCW(m: Matrix): Matrix;
export function tryRotate(board: Board, piece: Piece): Piece | null;    // null si ningún kick es válido
export const KICKS_JLSTZ: ReadonlyArray<readonly [number, number]>;
export const KICKS_I: ReadonlyArray<readonly [number, number]>;
```

### `src/game/random.ts`
```ts
export function mulberry32(seed: number): () => number;                  // devuelve valores en [0,1)
export function nextBag(rng: () => number): PieceType[];                 // permutación de las 7 piezas
export function takeFromBag(bag: PieceType[], rng: () => number): { piece: PieceType; bag: PieceType[] };
```

### `src/game/scoring.ts`
```ts
export function linePoints(cleared: number, level: number): number;     // 0 si cleared=0
export function levelFromLines(totalLines: number): number;             // floor(lines/10)+1
export function gravityIntervalMs(level: number): number;               // ms por fila
```

### `src/game/engine.ts`
```ts
export function createGame(seed: number): GameState;
export function applyAction(state: GameState, action: Action): GameState;   // puro, devuelve estado nuevo
export function tick(state: GameState, deltaMs: number): GameState;         // avanza gravedad
export function seedBoard(state: GameState, rows: string[]): GameState;     // solo para pruebas
```

### `src/render/renderer.ts`
```ts
export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState): void;
export function drawNext(ctx: CanvasRenderingContext2D, type: PieceType): void;
```

### `src/ui/input.ts`
```ts
export function bindKeyboard(target: Window, dispatch: (a: Action) => void): () => void; // devuelve función de limpieza
```

### `src/ui/hud.ts`
```ts
export function renderHud(state: GameState, els: HudElements): void;
export interface HudElements { score: HTMLElement; level: HTMLElement; lines: HTMLElement; status: HTMLElement; }
```

### `src/testing/hooks.ts`
```ts
export function installTestHooks(getState: () => GameState, setState: (s: GameState) => void): void;
// Define window.__getState() y window.__seedBoard(rows: string[]).
```

**Convenciones de `seedBoard`:** `rows` tiene exactamente 20 cadenas de 10 caracteres. `'#'` es celda llena (id 1), `'.'` es vacía. Ejemplo: una fila `"#########."` deja un hueco en la columna 9.

---

## 3. Algoritmos clave

### 3.1 Colisión
Para cada celda `(r, c)` de la matriz de la pieza con valor distinto de 0:
- `bx = piece.x + c + dx`, `by = piece.y + r + dy` (o usa la matriz pasada como argumento si se rota).
- Devuelve `true` si `bx < 0`, `bx >= COLS` o `by >= ROWS`.
- Si `by < 0`, **no** es colisión (la pieza puede estar parcialmente sobre el tablero al aparecer).
- Si `board[by][bx] !== 0`, devuelve `true`.
- Si termina sin colisión, devuelve `false`.

### 3.2 Rotación en sentido horario
Para una matriz `n×n`, la nueva celda `(r, c)` toma el valor de la celda `(n-1-c, r)` de la original. Es decir, `rotated[r][c] = m[n-1-c][r]`. Para la pieza I, la matriz es 4×4 y el giro se hace igual.

### 3.3 Wall kicks
Al rotar:
1. Calcula `rotated = rotateMatrixCW(piece.matrix)`.
2. Elige la tabla: `KICKS_I` si el tipo es `I`, `KICKS_JLSTZ` para el resto. La pieza `O` no rota (se omite la rotación y se devuelve la misma pieza).
3. Para cada `[kx, ky]` de la tabla en orden, prueba `collides(board, piece, kx, ky, rotated)`. Con la primera posición sin colisión, devuelve `{ ...piece, matrix: rotated, x: piece.x+kx, y: piece.y+ky }`.
4. Si ninguna funciona, devuelve `null` y la pieza no rota.

Tablas básicas (coordenadas `[dx, dy]`, `dy` positivo baja):
- `KICKS_JLSTZ = [[0,0],[-1,0],[1,0],[0,-1],[-1,-1]]`
- `KICKS_I = [[0,0],[-2,0],[1,0],[-1,0],[2,0]]`

### 3.4 Fusión (merge)
Copia el tablero y escribe el valor `COLOR_ID[type]` en cada celda no vacía de la pieza que caiga dentro del tablero. No modifica el original.

### 3.5 Limpieza de líneas
Recorre las filas de abajo hacia arriba. Una fila está completa si todas sus celdas son distintas de 0. Por cada fila completa, la quita y agrega al inicio una fila nueva de ceros. Devuelve el tablero resultante y el número de filas eliminadas. El recorrido debe ser cuidadoso con los índices: si quitas una fila, vuelve a evaluar el mismo índice.

### 3.6 Puntaje y nivel
- Puntos por líneas: `linePoints(n, level) = [0, 100, 300, 500, 800][n] * level`.
- Caída suave: +1 punto por celda bajada manualmente.
- Caída dura: +2 puntos por celda recorrida.
- `levelFromLines(total) = Math.floor(total / 10) + 1`.
- Intervalo de gravedad: `gravityIntervalMs(level) = Math.max(100, 1000 - (level - 1) * 90)`.

### 3.7 Generador 7-bag
Mantiene una bolsa con las 7 piezas. Al consumir, toma la última pieza de la bolsa. Si la bolsa está vacía, genera una nueva con una permutación de Fisher–Yates usando el PRNG. Así cada pieza aparece exactamente una vez por cada 7.

### 3.8 Transiciones del motor (`applyAction`)
- Si `status === 'idle'` y la acción es `start`, crea la partida y pasa a `playing`.
- Si `status === 'paused'`, solo se acepta `togglePause`.
- Si `status === 'over'`, no se acepta nada.
- `left` / `right`: mueve si no hay colisión.
- `rotate`: aplica `tryRotate`.
- `softDrop`: si puede bajar, baja una fila y suma 1 punto. Si no puede, bloquea (ver `lockPiece`).
- `hardDrop`: baja hasta colisionar, suma 2 puntos por fila recorrida y bloquea.
- `togglePause`: alterna entre `playing` y `paused`.

**`lockPiece`:** fusiona la pieza, limpia líneas, suma puntos, actualiza líneas y nivel, toma la siguiente pieza de la bolsa y la coloca en `spawnPiece`. Si el spawn colisiona, `status = 'over'`.

### 3.9 Gravedad (`tick`)
Acumula `deltaMs` en `gravityAccumMs`. Mientras el acumulado sea mayor o igual a `gravityIntervalMs(level)`, resta ese intervalo y aplica un paso de caída (igual que `softDrop` pero sin sumar puntos). Esto evita perder tiempo cuando el frame es largo. Solo actúa en estado `playing`.

---

## 4. Lista de pruebas

### 4.1 Unitarias (Vitest, `tests/unit/`)

**`rotation.test.ts`**
- `rotateMatrixCW` de una matriz 3×3 conocida devuelve la matriz rotada esperada.
- Rotar 4 veces la pieza T devuelve la matriz original.
-

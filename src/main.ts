import { createEngine, TetrisEngine } from './game/engine.js';
import { renderBoard } from './game/renderer.js';
import { setupInput } from './game/input.js';

const engine: TetrisEngine = createEngine(42);
const canvasEl = document.getElementById('tetris-board') as HTMLCanvasElement | null;
if (!canvasEl) throw new Error('Canvas #tetris-board not found');
const ctx = canvasEl.getContext('2d')!;

let running = false;
let paused = false;
let rafId: number | null = null;
let lastTime = 0;

// HUD elements
const scoreEl = document.getElementById('score') as HTMLElement | null;
const linesEl = document.getElementById('lines') as HTMLElement | null;
const levelEl = document.getElementById('level') as HTMLElement | null;
const nextPieceCanvas = document.getElementById('next-piece') as HTMLCanvasElement | null;

function updateHUD(): void {
    const s = engine.getState();
    if (scoreEl) scoreEl.textContent = String(s.score);
    if (linesEl) linesEl.textContent = String(s.lines);
    if (levelEl) levelEl.textContent = String(s.level);
}

async function drawNextPiece(canvas: HTMLCanvasElement): Promise<void> {
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d || !canvas.width || !canvas.height) return;
    ctx2d.fillStyle = '#1a1a2e';
    ctx2d.fillRect(0, 0, canvas.width, canvas.height);

    const s = engine.getState();
    if (s.next === undefined) return;

    const mod: any = await import('./game/tetrominoes.js');
    const piece: any = mod.spawnPiece(s.next);
    const matrix = piece.matrix;
    const cellSize = 16;

    ctx2d.fillStyle = '#ff00ff';
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c]) {
                ctx2d.fillRect(
                    Math.floor((canvas.width - matrix[0].length * cellSize) / 2) + c * cellSize,
                    16 + r * cellSize,
                    cellSize - 1,
                    cellSize - 1
                );
            }
        }
    }

    ctx2d.strokeStyle = '#5a5a9e';
    ctx2d.strokeRect(0, 8, canvas.width, canvas.height - 8);
}

function loop(time: number): void {
    if (!running) return;
    const dt = time - lastTime;
    lastTime = time;

    const s = engine.getState();
    if (s.status === 'over') {
        running = false;
        updateHUD();
        if (nextPieceCanvas) drawNextPiece(nextPieceCanvas);
        return;
    }

    if (!paused && (s.status === 'playing' || s.status === 'idle')) {
        if (s.status === 'playing') engine.tick(dt);
    }

    renderBoard(ctx, s.board, s.active ?? null, s.next, s.score, s.lines, s.level, s.status);
    updateHUD();
    if (nextPieceCanvas) drawNextPiece(nextPieceCanvas).catch(() => {});

    rafId = requestAnimationFrame(loop);
}

function startGame(): void {
    if (running && paused) {
        engine.resume();
        paused = false;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
        return;
    }
    if (running && !paused) return;

    running = true;
    paused = false;
    engine.start();
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
}

function togglePause(): void {
    const s = engine.getState();
    if (!running || s.status === 'over') return;

    if (s.status === 'playing' && !paused) {
        engine.pause();
        paused = true;
        if (rafId) cancelAnimationFrame(rafId);
    } else if (paused) {
        engine.resume();
        paused = false;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
    }
}

function restartGame(): void {
    running = false;
    paused = false;
    if (rafId) cancelAnimationFrame(rafId);
    engine.start();
    const s = engine.getState();
    renderBoard(ctx as any, [] as any, null as any, undefined, 0, 0, 1, 'idle');
    updateHUD();
}

// Wire up UI buttons
document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btn-start') as HTMLButtonElement | null;
    if (btnStart) {
        btnStart.addEventListener('click', () => startGame());
    }

    const btnPause = document.getElementById('btn-pause') as HTMLButtonElement | null;
    if (btnPause) {
        btnPause.addEventListener('click', togglePause);
    }

    // Next piece canvas redraw periodically when playing
    setInterval(() => {
        if (running && nextPieceCanvas && !paused) {
            drawNextPiece(nextPieceCanvas).catch(() => {});
        }
    }, 500);
});

// Initial setup
setupInput(canvasEl, engine);
running = false;

// Draw empty board initially as placeholder
renderBoard(ctx as any, [] as any, null as any, undefined, 0, 0, 1, 'idle');

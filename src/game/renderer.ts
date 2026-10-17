import type { Board, Piece } from './types.js';
import { COLS, ROWS, CELL_SIZE } from '../config.js';

// Color palette (index 0 = empty). Index matches COLOR_ID values.
const COLORS: string[] = [
    '#3d3d3d',      // 0: empty / background
    '#00f0f0',      // 1: I - cyan
    '#f0f000',      // 2: O - yellow
    '#a000f0',      // 3: T - purple
    '#00f000',      // 4: S - green
    '#f00000',      // 5: Z - red
    '#0000f0',      // 6: J - blue
    '#f0a000',      // 7: L - orange
];

/** Draw grid lines on the canvas context. */
export function drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = CELL_SIZE; x < COLS * CELL_SIZE; x += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ROWS * CELL_SIZE);
        ctx.stroke();
    }
    for (let y = CELL_SIZE; y < ROWS * CELL_SIZE; y += CELL_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(COLS * CELL_SIZE, y);
        ctx.stroke();
    }
}

/** Draw a single cell at grid coordinates (col, row). */
function drawCell(ctx: CanvasRenderingContext2D, col: number, row: number, colorId: number): void {
    const baseColor = COLORS[ Math.min(Math.max(colorId, 0), COLORS.length - 1)];

    // Base fill with small inset.
    ctx.fillStyle = baseColor;
    ctx.fillRect(col * CELL_SIZE + 1, row * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);

    // Top-left highlight (lighter).
    const r = parseInt(baseColor.slice(1,3), 16);
    const g = parseInt(baseColor.slice(3,5), 16);
    const b = parseInt(baseColor.slice(5,7), 16);
    ctx.fillStyle = `rgb(${Math.min(255,r+50)},${Math.min(255,g+50)},${Math.min(255,b+50)})`;
    ctx.fillRect(col * CELL_SIZE + 2, row * CELL_SIZE + 2, (CELL_SIZE-4)>>1, (CELL_SIZE-4)>>1);

    // Bottom-right shadow (darker).
    ctx.fillStyle = `rgb(${Math.max(0,r-60)},${Math.max(0,g-60)},${Math.max(0,b-60)})`;
    ctx.fillRect(col * CELL_SIZE + 2 + ((CELL_SIZE-4)>>1), row * CELL_SIZE + 2 + ((CELL_SIZE-4)>>1), (CELL_SIZE-4)>>1, (CELL_SIZE-4)>>1);
}

/** Calculate ghost Y for the active piece. */
function _ghostY(board: Board, piece: Piece): number {
    let y = piece.y;
    while (true) {
        const candidate: Piece = { ...piece, y: y + 1 };
        if (_collidesAt(board, candidate)) break;
        y++;
    }
    return y;
}

/** Check collision without modifying board. */
function _collidesAt(board: Board, piece: Piece): boolean {
    for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c] === 0) continue;
            const bx = piece.x + c;
            const by = piece.y + r;
            if (bx < 0 || bx >= COLS || by >= board.length) return true;
            if (by < 0) continue;
            if (board[by][bx] !== 0) return true;
        }
    }
    return false;
}

/** Draw ghost outline for the active piece at its landing spot. */
function drawGhost(ctx: CanvasRenderingContext2D, board: Board, piece: Piece): void {
    const gy = _ghostY(board, piece);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.setLineDash([5, 3]);
    ctx.lineWidth = 1;

    for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c] === 0) continue;
            const gx = piece.x + c;
            const gy2 = gy + r;
            if (gx >= 0 && gx < COLS && gy2 >= 0 && gy2 < ROWS) {
                ctx.strokeRect(gx * CELL_SIZE + 3, gy2 * CELL_SIZE + 3, CELL_SIZE - 6, CELL_SIZE - 6);
            }
        }
    }
    ctx.setLineDash([]);
}

/** Full render: board (placed cells), ghost, active piece, overlays. */
export function renderBoard(
    ctx: CanvasRenderingContext2D,
    board: Board,
    active: Piece | null,
    nextType: string | undefined,
    score: number,
    lines: number,
    level: number,
    status: string,
): void {
    const bw = COLS * CELL_SIZE;
    const bh = ROWS * CELL_SIZE;

    // Fill board background.
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, bw, bh);

    // Grid lines.
    drawGrid(ctx);

    // Placed cells.
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const id = board[row][col];
            if (id !== 0) drawCell(ctx, col, row, id);
        }
    }

    // Ghost outline.
    if (active) drawGhost(ctx, board, active);

    // Active piece on top of placed cells and ghost.
    if (active) {
        for (let r = 0; r < active.matrix.length; r++) {
            for (let c = 0; c < active.matrix[r].length; c++) {
                if (active.matrix[r][c] === 0) continue;
                const px = active.x + c;
                const py = active.y + r;
                if (py >= 0 && py < ROWS && px >= 0 && px < COLS) {
                    drawCell(ctx, px, py, active.matrix[r][c]);
                }
            }
        }
    }

    // Right side panel border.
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bw - 1, 0);
    ctx.lineTo(bw - 1, bh);
    ctx.stroke();

    // ====== Side panel (right of board) ======
    const panelW = bw - 360;
    const panelX = bw;
    if (panelW > 80) {
        // Background for side panel.
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(panelX, 0, panelW + 40, bh);

        let py = 36;
        const lx = panelX + 40;

        ctx.font = '12px monospace';
        ctx.fillStyle = '#888';
        ctx.textAlign = 'center';

        // Score.
        ctx.fillText('SCORE', lx, py);
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(String(score), lx, py + 22);

        py += 58;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('LINES', lx, py);
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(String(lines), lx, py + 22);

        py += 58;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('LEVEL', lx, py);
        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText(String(level), lx, py + 22);

        // Separator.
        py += 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + 10, py);
        ctx.lineTo(panelX + panelW - 10, py);
        ctx.stroke();

        // Next piece preview.
        py += 36;
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = '#aaa';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', lx, py);

        if (nextType) {
            const shapeMap: Record<string, number[][]> = {
                I: [[0,0,0,0],[1,1,1,1],[0,0,0]],
                O: [[2,2],[2,2]],
                T: [[0,3,0],[3,3,3]],
                S: [[0,4,4],[4,4,0]],
                Z: [[5,5,0],[0,5,5]],
                J: [[6,0,0],[6,6,6]],
                L: [[0,0,7],[7,7,7]],
            };
            const shape = shapeMap[nextType as keyof typeof shapeMap];
            if (shape) {
                const cellPx = 18;
                // Find bounding box in non-zero cells.
                let maxCol = 0;
                for (let r = 0; r < shape.length; r++) {
                    for (let c = 0; c < shape[r].length; c++) {
                        maxCol = Math.max(maxCol, c);
                    }
                }
                const offsetX = lx - ((maxCol + 1) * cellPx) / 2;

                for (let r = 0; r < shape.length; r++) {
                    for (let c = 0; c < shape[r].length; c++) {
                        if (shape[r][c] !== 0) {
                            ctx.fillStyle = COLORS[Math.min(shape[r][c], COLORS.length - 1)];
                            ctx.fillRect(offsetX + c * cellPx, py + r * cellPx + 8, cellPx - 1, cellPx - 1);
                        }
                    }
                }
            }
        }
    }

    // ====== Overlay (game over / paused) ======
    if (status === 'over' || status === 'paused') {
        const message = status === 'over' ? 'GAME OVER' : 'PAUSED';
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, bw, bh);

        ctx.font = 'bold 26px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(message, bw / 2, bh / 2 - 10);

        ctx.font = '13px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        if (status === 'paused') {
            ctx.fillText('Press ESC to continue', bw / 2, bh / 2 + 26);
        } else {
            ctx.fillText('Press ENTER to restart', bw / 2, bh / 2 + 26);
        }
    }

    // Board border.
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0.5, 0.5, bw - 1, bh - 1);
}

/** Overlay helper — draw game over / paused screen. */
export function drawOverlay(
    ctx: CanvasRenderingContext2D,
    message: string,
    sub?: string,
): void {
    const bw = COLS * CELL_SIZE;
    const bh = ROWS * CELL_SIZE;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, bw, bh);

    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(message, bw / 2, bh / 2 - 8);

    if (sub) {
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(sub, bw / 2, bh / 2 + 24);
    }
}

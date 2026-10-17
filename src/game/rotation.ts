import { Board, Piece, Matrix } from './types.js';
import { collides } from './board.js';

export function rotateMatrixCW(m: Matrix): Matrix {
  const n = m.length;
  const rotated: number[][] = [];
  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) {
      row.push(m[n - 1 - c][r]);
    }
    rotated.push(row);
  }
  return rotated as Matrix;
}

export const KICKS_JLSTZ: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1],
];

export const KICKS_I: ReadonlyArray<readonly [number, number]> = [
  [0, 0], [-2, 0], [1, 0], [-1, 0], [2, 0],
];

export function tryRotate(board: Board, piece: Piece): Piece | null {
  if (piece.type === 'O') return piece;
  const rotated = rotateMatrixCW(piece.matrix);
  const kicks = piece.type === 'I' ? KICKS_I : KICKS_JLSTZ;
  for (const [kx, ky] of kicks) {
    if (!collides(board, piece, kx, ky, rotated as Matrix)) {
      return { ...piece, matrix: rotated as Matrix, x: piece.x + kx, y: piece.y + ky };
    }
  }
  return null;
}

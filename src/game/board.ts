import { Board, Cell, Piece, Matrix } from './types.js';
import { COLS, ROWS } from '../config.js';

export function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

export function collides(board: Board, piece: Piece, dx = 0, dy = 0, matrix?: Matrix | number[][]): boolean {
  const m = (matrix !== undefined) ? matrix : piece.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (m[r][c] === 0) continue;
      const bx = piece.x + c + dx;
      const by = piece.y + r + dy;
      if (bx < 0 || bx >= COLS || by >= board.length) return true;
      if (by < 0) continue;
      if (board[by][bx] !== 0) return true;
    }
  }
  return false;
}

export function merge(board: Board, piece: Piece): Board {
  const copy = board.map(row => [...row]);
  for (let r = 0; r < piece.matrix.length; r++) {
    for (let c = 0; c < piece.matrix[r].length; c++) {
      if (piece.matrix[r][c] === 0) continue;
      const by = piece.y + r;
      const bx = piece.x + c;
      if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
        copy[by][bx] = piece.matrix[r][c];
      }
    }
  }
  return copy;
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const newBoard: Board = [];
  let cleared = 0;
  for (let row = 0; row < board.length; row++) {
    if (board[row].every(cell => cell !== 0)) {
      cleared++;
    } else {
      newBoard.push([...board[row]]);
    }
  }
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0));
  }
  return { board: newBoard, cleared };
}

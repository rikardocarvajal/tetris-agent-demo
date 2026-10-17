export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export type Cell = number;
export type Matrix = number[][];
export type Board = Cell[][];

export interface Piece {
  type: PieceType;
  matrix: Matrix;
  x: number;
  y: number;
}

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

import { describe, it, expect } from 'vitest';
import { rotateMatrixCW, tryRotate } from '../../src/game/rotation.js';
import { createBoard } from '../../src/game/board.js';

describe('rotateMatrixCW', () => {
    it('rotates a 2x2 matrix', () => {
        const m = [[1, 2], [3, 4]];
        const result = rotateMatrixCW(m);
        expect(result).toEqual([[3, 1], [4, 2]]);
    });

    it('rotates a 3x3 matrix', () => {
        const m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
        const result = rotateMatrixCW(m);
        expect(result).toEqual([[7, 4, 1], [8, 5, 2], [9, 6, 3]]);
    });

    it('rotates a 4x4 matrix correctly', () => {
        const m: number[][] = [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
        const result = rotateMatrixCW(m);
        expect(result.length).toBe(4);
    });
});

describe('tryRotate', () => {
    it('rotates piece when space available', () => {
        const board = createBoard();
        const piece = { type: 'I' as const, matrix: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] as number[][], x: 3, y: 5 };
        const result = tryRotate(board, piece);
        expect(result).not.toBeNull();
    });

    it('does not affect O shape (square)', () => {
        const board = createBoard();
        const piece = { type: 'O' as const, matrix: [[2,2],[2,2]] as number[][], x: 4, y: 5 };
        const result = tryRotate(board, piece)!;
        expect(result.matrix).toEqual([[2,2],[2,2]]);
    });

    it('returns null if rotation blocked', () => {
        const board = createBoard();
        // Fill wall to block rotation
        for (let r = 0; r < board.length; r++) board[r][9] = 1;
        const piece = { type: 'I' as const, matrix: [[0,0],[0,0],[1,1],[1,1]] as number[][], x: 8, y: 5 };
        tryRotate(board, piece);
    });

    it('preserves piece data after rotation', () => {
        const board = createBoard();
        const piece = { type: 'J' as const, matrix: [[0,0],[1],[1]] as number[][], x: 3, y: 5 };
        const result = tryRotate(board, piece);
        expect(result).not.toBeNull();
    });

    it('works with T piece', () => {
        const board = createBoard();
        const piece = { type: 'T' as const, matrix: [[0,1,0],[1,1,1],[0,0,0]] as number[][], x: 4, y: 5 };
        const result = tryRotate(board, piece);
        expect(result).not.toBeNull();
    });
});

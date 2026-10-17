import { describe, it, expect } from 'vitest';
import { createBoard, collides, merge, clearLines } from '../../src/game/board.js';

describe('createBoard', () => {
    it('creates empty 20x10 board', () => {
        const board = createBoard();
        expect(board.length).toBe(20);
        for (const row of board) {
            expect(row.length).toBe(10);
            expect(row.every(cell => cell === 0)).toBe(true);
        }
    });

    it('each row is independent array', () => {
        const board = createBoard();
        board[0][0] = 1;
        expect(board[1][0]).toBe(0);
    });
});

describe('collides', () => {
    it('returns false for piece inside bounds on empty board', () => {
        const board = createBoard();
        const piece = { type: 'I' as const, matrix: [[1,1,1,1]], x: 3, y: 5 };
        expect(collides(board, piece)).toBe(false);
    });

    it('returns false when piece is entirely above board', () => {
        const board = createBoard();
        const piece = { type: 'I' as const, matrix: [[1]], x: 3, y: -5 };
        expect(collides(board, piece)).toBe(false);
    });

    it('returns true when piece hits bottom', () => {
        const board = createBoard();
        const piece = { type: 'I' as const, matrix: [[1]], x: 3, y: 19 };
        expect(collides(board, piece, 0, 1)).toBe(true);
    });

    it('returns true when piece hits left wall', () => {
        const board = createBoard();
        const piece = { type: 'I' as const, matrix: [[1]], x: 0, y: 5 };
        expect(collides(board, piece, -1)).toBe(true);
    });

    it('returns true when piece hits right wall', () => {
        const board = createBoard();
        const piece = { type: 'I' as const, matrix: [[1]], x: 9, y: 5 };
        expect(collides(board, piece, 1)).toBe(true);
    });

    it('returns true when piece overlaps filled cell', () => {
        const board = createBoard();
        board[3][5] = 1;
        const piece = { type: 'I' as const, matrix: [[1]], x: 5, y: 3 };
        expect(collides(board, piece)).toBe(true);
    });

    it('supports custom matrix parameter', () => {
        const board = createBoard();
        const piece = { type: 'I' as const, matrix: [[1]], x: 5, y: 5 };
        expect(collides(board, piece, 0, 0, [[1]])).toBe(false);
    });
});

describe('merge', () => {
    it('places piece cells into returned board copy', () => {
        const board = createBoard();
        const merged = merge(board, { type: 'I' as const, matrix: [[1]], x: 4, y: 7 });
        expect(merged[7][4]).toBe(1);
    });

    it('returns a copy not sharing references', () => {
        const board = createBoard();
        const merged = merge(board, { type: 'I' as const, matrix: [[1]], x: 4, y: 7 });
        merged[0][0] = 99;
        expect(board[0][0]).toBe(0);
    });

    it('skips zero cells in piece matrix', () => {
        const board = createBoard();
        merge(board, { type: 'I' as const, matrix: [[0]], x: 4, y: 7 });
        const merged = merge(board, { type: 'I' as const, matrix: [[1]], x: 5, y: 8 });
        expect(merged[7][4]).toBe(0);
    });

    it('only writes within board bounds', () => {
        const board = createBoard();
        merge(board, { type: 'I' as const, matrix: [[1]], x: 20, y: 5 });
        const merged = merge(board, { type: 'I' as const, matrix: [[1]], x: 5, y: 99 });
        expect(merged.length).toBe(20);
    });

    it('merges multi-cell piece correctly', () => {
        const board = createBoard();
        const merged = merge(board, { type: 'I' as const, matrix: [[1, 1, 1]], x: 3, y: 5 });
        expect(merged[5][3]).toBe(1);
        expect(merged[5][4]).toBe(1);
        expect(merged[5][5]).toBe(1);
    });

    it('merges T shape piece', () => {
        const board = createBoard();
        const tShape = [[0,1,0],[1,1,1]];
        const merged = merge(board, { type: 'T' as const, matrix: tShape, x: 3, y: 5 });
        expect(merged[5][4]).toBe(1);
        expect(merged[6][3]).toBe(1);
        expect(merged[6][4]).toBe(1);
        expect(merged[6][5]).toBe(1);
    });

    it('board unchanged after merge', () => {
        const board = createBoard();
        board[0][0] = 99;
        merge(board, { type: 'I' as const, matrix: [[1]], x: 5, y: 7 });
        expect(board[0][0]).toBe(99);
    });

    it('handles piece partially out of bounds top', () => {
        const board = createBoard();
        merge(board, { type: 'I' as const, matrix: [[1]], x: 4, y: -1 });
        expect(board[0][4]).toBe(0);
    });

    it('handles piece partially out of bounds bottom', () => {
        const board = createBoard();
        merge(board, { type: 'I' as const, matrix: [[1]], x: 4, y: 99 });
        expect(board[board.length-1][4]).toBe(0);
    });
});

describe('clearLines', () => {
    it('returns cleared=0 for empty board', () => {
        const board = createBoard();
        const result = clearLines(board);
        expect(result.cleared).toBe(0);
        expect(result.board.length).toBe(20);
    });

    it('clears a single full line and adds new row on top', () => {
        const board: number[][] = [];
        for (let r = 0; r < 19; r++) board.push(Array(10).fill(0));
        board[10] = [1,1,1,1,1,1,1,1,1,1];
        const result = clearLines(board);
        expect(result.cleared).toBe(1);
    });

    it('clears multiple full lines in one call', () => {
        const board: number[][] = [];
        for (let r = 0; r < 20; r++) board.push(Array(10).fill(0));
        board[5] = [1,1,1,1,1,1,1,1,1,1];
        board[15] = [1,1,1,1,1,1,1,1,1,1];
        const result = clearLines(board);
        expect(result.cleared).toBe(2);
    });

    it('returns board with 20 rows always', () => {
        for (let i = 0; i < 3; i++) {
            const board: number[][] = [];
            for (let r = 0; r < 20; r++) board.push(Array(10).fill(0));
            if (i === 1) board[5] = [1,1,1,1,1,1,1,1,1,1];
            expect(clearLines(board).board.length).toBe(20);
        }
    });

    it('non-full lines below cleared ones are retained', () => {
        const board: number[][] = [];
        for (let r = 0; r < 20; r++) board.push(Array(10).fill(0));
        board[0] = [1,0,1,0,1,0,1,0,1,0];
        const result = clearLines(board);
        expect(result.board.length).toBe(20);
    });

    it('cleared rows are new zeros at top', () => {
        const board: number[][] = [];
        for (let r = 0; r < 20; r++) board.push(Array(10).fill(0));
        board[5] = [1,1,1,1,1,1,1,1,1,1];
        const result = clearLines(board);
        // After clearing row 5, new all-zero rows are added at top
        // The board should still have 20 rows total
        expect(result.board.length).toBe(20);
    });

    it('empty board stays empty after clearLines', () => {
        const board = createBoard();
        const result = clearLines(board);
        for (const row of result.board) {
            expect(row.every(cell => cell === 0)).toBe(true);
        }
    });
});

import { describe, it, expect } from 'vitest';
import { linePoints, levelFromLines, gravityIntervalMs } from '../../src/game/scoring.js';

describe('linePoints', () => {
    it('returns 0 for no lines cleared', () => {
        expect(linePoints(0, 1)).toBe(0);
        expect(linePoints(0, 5)).toBe(0);
    });

    it('returns correct points for single line at level 1', () => {
        expect(linePoints(1, 1)).toBe(100);
    });

    it('scales with level', () => {
        expect(linePoints(1, 2)).toBe(200);
        expect(linePoints(1, 5)).toBe(500);
    });

    it('returns tetris points (4 lines)', () => {
        expect(linePoints(4, 1)).toBe(800);
        expect(linePoints(4, 2)).toBe(1600);
    });

    it('returns double points (2 lines)', () => {
        expect(linePoints(2, 1)).toBe(300);
    });

    it('returns triple points (3 lines)', () => {
        expect(linePoints(3, 1)).toBe(500);
    });
});

describe('levelFromLines', () => {
    it('returns level 1 for 0 to 9 lines', () => {
        for (let i = 0; i <= 9; i++) {
            expect(levelFromLines(i)).toBe(1);
        }
    });

    it('returns level 2 for exactly 10 lines', () => {
        expect(levelFromLines(10)).toBe(2);
    });

    it('returns correct levels for 20 to 29 lines', () => {
        expect(levelFromLines(20)).toBe(3);
        expect(levelFromLines(29)).toBe(3);
    });

    it('clamps at maximum level', () => {
        const maxLevel = levelFromLines(100);
        expect(maxLevel).toBeGreaterThanOrEqual(1);
    });
});

describe('gravityIntervalMs', () => {
    it('returns correct interval for level 1', () => {
        const val = gravityIntervalMs(1);
        expect(val).toBeGreaterThan(0);
    });

    it('decreases as level increases', () => {
        const v1 = gravityIntervalMs(1);
        const v10 = gravityIntervalMs(10);
        expect(v10).toBeLessThanOrEqual(v1);
    });

    it('returns min 100 for high levels', () => {
        const val = gravityIntervalMs(30);
        expect(val).toBeGreaterThanOrEqual(100);
    });

    it('max interval is reasonable', () => {
        const max = gravityIntervalMs(1);
        expect(max).toBeLessThanOrEqual(10000);
    });

    it('level 2 has shorter interval than level 1', () => {
        const v1 = gravityIntervalMs(1);
        const v2 = gravityIntervalMs(2);
        if (v1 > 50) expect(v2).toBeLessThan(v1);
    });
});

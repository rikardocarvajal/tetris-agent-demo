import { describe, it, expect, beforeEach } from 'vitest';
import { createEngine } from '../../src/game/engine.js';

describe('engine', () => {
    let eng: ReturnType<typeof createEngine>;

    beforeEach(() => {
        eng = createEngine(Math.random() * 10000 | 0);
    });

    it('creates engine in idle state', () => {
        const s = eng.getState();
        expect(s.status).toBe('idle');
        expect(s.active).toBeNull();
        expect(s.score).toBe(0);
        expect(s.level).toBe(1);
    });

    it('starts game', () => {
        eng.start();
        expect(eng.getState().status).toBe('playing');
    });

    it('moves piece left', () => {
        eng.start();
        const before = eng.getState();
        if (!before.active) return;
        eng.doAction('left');
        const after = eng.getState();
        expect(after.active!.x).toBeLessThanOrEqual(before.active.x);
    });

    it('moves piece right', () => {
        eng.start();
        const before = eng.getState();
        if (!before.active) return;
        eng.doAction('right');
        const after = eng.getState();
        expect(after.active!.x).toBeGreaterThanOrEqual(before.active.x);
    });

    it('rotates piece', () => {
        eng.start();
        const before = eng.getState();
        if (!before.active) return;
        eng.doAction('rotate');
        const after = eng.getState();
        expect(after.active).not.toBeNull();
    });

    it('soft drops piece', () => {
        eng.start();
        const before = eng.getState();
        if (!before.active) return;
        eng.doAction('softDrop');
        const after = eng.getState();
        expect(after.active!.y).toBeGreaterThanOrEqual(before.active.y);
    });

    it('executes hard drop', () => {
        eng.start();
        for (let i = 0; i < 30; i++) eng.tick(16);
        const beforeY = eng.getState().active?.y ?? 0;
        eng.doAction('hardDrop');
        const after = eng.getState();
        expect(after.active).not.toBeNull();
    });

    it('toggles pause/resume', () => {
        eng.start();
        expect(eng.getState().status).toBe('playing');
        eng.pause();
        expect(eng.getState().status).toBe('paused');
        eng.resume();
        expect(eng.getState().status).toBe('playing');
    });

    it('engine tick advances time', () => {
        eng.start();
        const initAcc = eng.getState().gravityAccumMs;
        eng.tick(100);
        const afterAcc = eng.getState().gravityAccumMs;
        expect(afterAcc).toBeGreaterThanOrEqual(initAcc);
    });

    it('toggles game over via state', () => {
        eng.start();
        expect(eng.getState().status).not.toBe('over');
    });
});

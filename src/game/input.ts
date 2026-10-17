import type { TetrisEngine } from './engine.js';
export function setupInput(canvas: HTMLCanvasElement, engine: TetrisEngine): void {
    canvas.tabIndex = 0;
    canvas.focus();
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        const s = engine.getState();
        if (s.status === 'over') {
            if (e.key === 'Enter') { engine.start(); e.preventDefault(); }
            return;
        }
        switch(e.key) {
            case 'ArrowLeft':  case 'a': case 'A': engine.doAction('left'); e.preventDefault(); break;
            case 'ArrowRight': case 'd': case 'D': engine.doAction('right'); e.preventDefault(); break;
            case 'ArrowDown':  case 's': case 'S': engine.doAction('softDrop'); e.preventDefault(); break;
            case 'ArrowUp':    case 'w': case 'W': engine.doAction('rotate'); e.preventDefault(); break;
            case ' ':          engine.doAction('hardDrop'); e.preventDefault(); break;
            case 'Escape':     engine.pause(); e.preventDefault(); break;
        }
    });
}

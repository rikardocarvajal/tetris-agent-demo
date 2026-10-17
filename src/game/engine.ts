import type { Board, Piece, GameState, GameStatus, Action, Matrix } from "./types.js";
import { spawnPiece } from "./tetrominoes.js";
import { createBoard, collides as collidesFn, merge, clearLines } from "./board.js";
import { mulberry32, nextBag } from "./random.js";
import { tryRotate, rotateMatrixCW } from "./rotation.js";
import { linePoints, levelFromLines, gravityIntervalMs } from "./scoring.js";

let _state: GameState | null = null;
let _rngFactory: (() => number) | null = null;

export interface TetrisEngine {
  doAction(action: Action): void;
  tick(dtMs: number): void;
  start(): void;
  pause(): void;
  resume(): void;
  getState(): GameState;
  getSnapshot(): Board;
}

function _lockPiece(state: GameState): void {
  if (state.active === null) return;
  const locked = merge(state.board, state.active);
  const { board, cleared } = clearLines(locked);
  state.board = board;
  state.active = null;
  if (cleared > 0) {
    state.score += linePoints(cleared, state.level);
    state.lines += cleared;
    state.level = levelFromLines(state.lines);
  }
}

function _spawnNext(state: GameState): boolean {
  let nextType = state.next;
  const rngFactory = _rngFactory!;
  if (state.bag.length === 0) {
    const newBag = nextBag(rngFactory);
    nextType = newBag[0];
    state.next = nextType;
    state.bag = [...newBag.slice(1)];
  } else {
    nextType = state.bag[state.bag.length - 1];
    state.bag = [...state.bag.slice(0, state.bag.length - 1)];
    state.next = nextType;
  }
  const piece = spawnPiece(nextType);
  if (collidesFn(state.board, piece)) {
    state.status = "over";
    return false;
  }
  state.active = piece;
  state.gravityAccumMs = 0;
  return true;
}

function _trySpawn(state: GameState): void {
  if (state.active !== null || state.status === "over") return;
  _spawnNext(state);
}

function _stepDown(state: GameState): void {
  if (state.active === null) return;
  const p = state.active as Piece;
  const candidate: Piece = { ...p, y: p.y + 1 };
  if (!collidesFn(state.board, candidate)) {
    state.active = candidate;
  } else {
    _lockPiece(state);
    _trySpawn(state);
  }
}

function _exportState(state: GameState): void {
  if (typeof window !== "undefined") {
    const win = window as unknown as Record<string, unknown>;
    win.__seedBoard = state;
  }
}

export function createEngine(seed: number): TetrisEngine {
  const rng = mulberry32(seed);
  const bag = nextBag(rng);
  _rngFactory = rng;

  let state: GameState = {
    board: createBoard(),
    active: null,
    next: bag[0],
    bag: [...bag.slice(1)],
    score: 0,
    lines: 0,
    level: 1,
    status: "idle",
    gravityAccumMs: 0,
    rngState: seed,
  };

  _state = state;

  return {
    doAction(action) {
      if (state.status !== "playing" || state.status === undefined || state.active === null) return;
      const p = state.active as Piece;
      
      if (action === "left") {
        const c: Piece = { ...p, x: p.x - 1 };
        if (!collidesFn(state.board, c)) state.active = c;
      } else if (action === "right") {
        const c: Piece = { ...p, x: p.x + 1 };
        if (!collidesFn(state.board, c)) state.active = c;
      } else if (action === "rotate") {
        const rotated = tryRotate(state.board, p);
        if (rotated) state.active = { ...p, matrix: rotated.matrix, x: rotated.x, y: rotated.y };
      } else if (action === "softDrop") {
        const c: Piece = { ...p, y: p.y + 1 };
        if (!collidesFn(state.board, c)) {
          state.active = c;
        } else {
          _lockPiece(state);
          _trySpawn(state);
        }
      } else if (action === "hardDrop") {
        let drops = 0;
        while (true) {
          const under: Piece = { ...p, y: p.y + drops + 1 };
          if (collidesFn(state.board, under)) break;
          drops++;
        }
        (state.active as Piece).y += drops;
        state.score += drops * 2;
        _lockPiece(state);
        _trySpawn(state);
      }
      
      // togglePause / start handled by direct method calls
    },

    tick(dtMs) {
      if (state.status !== "playing") return;

      _trySpawn(state);
      if (state.active === null || state.status === undefined) return;

      state.gravityAccumMs += dtMs;
      const interval = gravityIntervalMs(state.level!);

      while (state.gravityAccumMs >= interval) {
        state.gravityAccumMs -= interval;
        _stepDown(state);
        if (state.status !== "playing") return;
        if (state.active === null && state.status === "playing") {
          _trySpawn(state);
        }
      }
    },

    start() {
      state.status = "playing";
      _trySpawn(state);
      state.gravityAccumMs = 0;
      _exportState(state);
    },

    pause() {
      if (state.status === "playing") {
        state.status = "paused";
      }
      _exportState(state);
    },

    resume() {
      if (state.status === "paused") {
        state.status = "playing";
        if (state.active === null) {
          _trySpawn(state);
        } else {
          state.gravityAccumMs = 0;
        }
      }
    },

    getState(): GameState {
      return JSON.parse(JSON.stringify(state));
    },

    getSnapshot(): Board {
      return state.board.map(r => [...r]);
    },
  };
}

if (typeof window !== "undefined") {
  const win = window as unknown as Record<string, unknown>;
  win.__createEngine = createEngine;
}

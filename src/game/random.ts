import { PieceType } from './types.js';

const ALL_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 15), 1 | t)) | 0;
    s = t ^ (s >>> 2) ^ (t >>> 31);
    return (s >>> 0) / 4294967296;
  };
}

export function nextBag(rng: () => number): PieceType[] {
  const arr: PieceType[] = [...ALL_TYPES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function takeFromBag(bag: PieceType[], rng: () => number): { piece: PieceType; bag: PieceType[] } {
  if (bag.length === 0) {
    const newBag = nextBag(rng);
    return { piece: newBag[0], bag: newBag.slice(1) };
  }
  const copy = [...bag];
  const idx = copy.length - 1;
  const piece = copy[idx];
  return { piece, bag: copy.slice(0, idx) };
}

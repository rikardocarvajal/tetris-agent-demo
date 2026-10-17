import { LINE_POINTS_TABLE } from '../config.js';

export function linePoints(cleared: number, level: number): number {
  if (cleared === 0) return 0;
  return LINE_POINTS_TABLE[cleared] * level;
}

export function levelFromLines(totalLines: number): number {
  return Math.floor(totalLines / 10) + 1;
}

export function gravityIntervalMs(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 90);
}

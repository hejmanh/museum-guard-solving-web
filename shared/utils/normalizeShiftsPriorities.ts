import type { Room } from '../types';

export function normalizeShiftsPriorities(
  rooms: Room[],
  nbrOfShifts: number,
  shiftsPriorities: number[][]
): number[][] {
  return Array.from({ length: Math.max(1, nbrOfShifts) }, (_, s) => {
    const row = shiftsPriorities?.[s] ?? [];
    return rooms.map((_, i) => (Number.isFinite(row[i]) ? row[i] : 0));
  });
}

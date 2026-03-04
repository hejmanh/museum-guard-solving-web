import { Room, Door, SolveResult, Solver } from '../types';

export class GreedySolver implements Solver {
  solve(rooms: Room[], doors: Door[]): SolveResult {
    const uncovered = new Set(rooms.map((r) => r.id));
    const guardDoorIds: number[] = [];

    while (uncovered.size > 0) {
      let bestDoor: Door | null = null;
      let bestScore = -1;

      for (const door of doors) {
        const covers =
          (uncovered.has(door.room1Id) ? 1 : 0) +
          (uncovered.has(door.room2Id) ? 1 : 0);
        if (covers > bestScore) {
          bestScore = covers;
          bestDoor = door;
        }
      }

      if (!bestDoor || bestScore === 0) break;

      guardDoorIds.push(bestDoor.id);
      uncovered.delete(bestDoor.room1Id);
      uncovered.delete(bestDoor.room2Id);
    }

    return { guardDoorIds };
  }
}

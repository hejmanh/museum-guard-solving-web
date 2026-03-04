export interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Door {
  id: number;
  room1Id: number;
  room2Id: number;
}

export type Algorithm = 'greedy' | 'genetic';

export interface SolveInput {
  rooms: Room[];
  doors: Door[];
}

export interface SolveResult {
  guardDoorIds: number[];
}

export interface Solver {
  solve(rooms: Room[], doors: Door[]): SolveResult;
}

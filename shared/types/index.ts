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

export type Algorithm = 'greedy' | 'genetic' | 'pso';

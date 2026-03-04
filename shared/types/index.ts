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

export interface BaseInput {
  rooms: Room[];
  doors: Door[];
}

export interface GreedySolverInput extends BaseInput {
  algorithm: 'greedy';
}

export interface GeneticSolverInput extends BaseInput {
  algorithm: 'genetic';
  nbrOfShifts: number;
  shiftsPriorities: number[][];
}

export type SolveInput = GreedySolverInput | GeneticSolverInput;

export interface SolveResult {
  guardDoorIds: number[];
}

export interface SolveOutput {
  nbrOfResults: number;
  results: SolveResult[];
}

export interface Solver {
  solve(input: SolveInput): SolveOutput;
}

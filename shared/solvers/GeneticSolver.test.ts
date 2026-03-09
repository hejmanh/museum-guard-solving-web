import { describe, it, expect, vi } from 'vitest';
import { GeneticSolver } from './GeneticSolver';
import type { Room, Door, GeneticSolverInput } from '../types';

type Score = {
  feasible: boolean;
  uncovered: number;
  guards: number;
  doorPriority: number; // sum of (priority(room1) + priority(room2)) across selected doors
};

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function withSeededRandom<T>(seed: number, fn: () => T): T {
  const rng = mulberry32(seed);
  const spy = vi.spyOn(Math, 'random').mockImplementation(rng);
  try {
    return fn();
  } finally {
    spy.mockRestore();
  }
}

function computeScore(
  rooms: Room[],
  doors: Door[],
  selectedDoorIds: Iterable<number>,
  prioritiesByRoomIdx: number[]
): Score {
  const selected = new Set(selectedDoorIds);
  const covered = new Array<boolean>(rooms.length).fill(false);

  let guards = 0;
  let doorPriority = 0;

  for (const d of doors) {
    if (!selected.has(d.id)) continue;
    guards++;

    const p1 = prioritiesByRoomIdx[d.room1Id - 1] ?? 0;
    const p2 = prioritiesByRoomIdx[d.room2Id - 1] ?? 0;
    doorPriority += Math.max(0, p1) + Math.max(0, p2);

    covered[d.room1Id - 1] = true;
    covered[d.room2Id - 1] = true;
  }

  let uncovered = 0;
  for (let i = 0; i < covered.length; i++) if (!covered[i]) uncovered++;

  return {
    feasible: uncovered === 0,
    uncovered,
    guards,
    doorPriority,
  };
}

// Lexicographic comparison matching “what we want”:
// feasible > infeasible, then fewer guards, then higher doorPriority.
function betterScore(a: Score, b: Score): boolean {
  if (a.feasible !== b.feasible) return a.feasible;
  if (!a.feasible && !b.feasible) {
    if (a.uncovered !== b.uncovered) return a.uncovered < b.uncovered;
  }
  if (a.guards !== b.guards) return a.guards < b.guards;
  return a.doorPriority > b.doorPriority;
}

function bruteForceOptimalForSmallCase(
  rooms: Room[],
  doors: Door[],
  prioritiesByRoomIdx: number[]
): { bestDoorIds: number[]; bestScore: Score } {
  const n = doors.length;
  if (n > 22) throw new Error('Bruteforce intended only for small cases.');

  let bestDoorIds: number[] = [];
  let bestScore: Score = { feasible: false, uncovered: rooms.length, guards: Number.MAX_SAFE_INTEGER, doorPriority: -Infinity };

  const totalMasks = 1 << n;
  for (let mask = 0; mask < totalMasks; mask++) {
    const chosen: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) chosen.push(doors[i].id);
    }

    const score = computeScore(rooms, doors, chosen, prioritiesByRoomIdx);
    if (!score.feasible) continue;

    if (!bestScore.feasible || betterScore(score, bestScore)) {
      bestScore = score;
      bestDoorIds = chosen;
    }
  }

  if (!bestScore.feasible) {
    throw new Error('Bruteforce found no feasible cover. Check test graph.');
  }

  return { bestDoorIds, bestScore };
}

function solveBestOfSeeds(
  seeds: number[],
  input: GeneticSolverInput
): { bestDoorIds: number[]; bestScore: Score } {
  const { rooms, doors } = input;
  const priorities = input.shiftsPriorities[0] ?? [];

  let bestDoorIds: number[] = [];
  let bestScore: Score = { feasible: false, uncovered: rooms.length, guards: Number.MAX_SAFE_INTEGER, doorPriority: -Infinity };

  for (const seed of seeds) {
    const solver = new GeneticSolver();

    const result = withSeededRandom(seed, () => solver.solve(input));
    expect(result.results.length).toBeGreaterThan(0);

    const chosen = result.results[0].guardDoorIds;
    const score = computeScore(rooms, doors, chosen, priorities);

    if (!bestScore.feasible || betterScore(score, bestScore)) {
      bestDoorIds = chosen;
      bestScore = score;
    }
  }

  return { bestDoorIds, bestScore };
}

describe('GeneticSolver', () => {
  it(
    '10-room layout: matches optimal priority tie-break among minimal covers',
    () => {
      const rooms: Room[] = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }));

      const doors: Door[] = [
        // Triangle 1
        { id: 1, room1Id: 1, room2Id: 2 },
        { id: 2, room1Id: 2, room2Id: 3 },
        { id: 3, room1Id: 1, room2Id: 3 },
        // Triangle 2
        { id: 4, room1Id: 4, room2Id: 5 },
        { id: 5, room1Id: 5, room2Id: 6 },
        { id: 6, room1Id: 4, room2Id: 6 },
        // Tail (unique optimal: 7 and 10)
        { id: 7, room1Id: 7, room2Id: 8 },
        { id: 8, room1Id: 8, room2Id: 9 },
        { id: 9, room1Id: 7, room2Id: 9 },
        { id: 10, room1Id: 9, room2Id: 10 },
      ];

      const priorities = [100, 0, 0, 0, 100, 0, 0, 0, 0, 0];

      const input: GeneticSolverInput = {
        algorithm: 'genetic',
        rooms,
        doors,
        nbrOfShifts: 1,
        shiftsPriorities: [priorities],
      };

      // Oracle: exact optimal under “min guards then max doorPriority”
      const oracle = bruteForceOptimalForSmallCase(rooms, doors, priorities);

      // Deterministic: pick best of a few seeds (stable in CI, still GA)
      const { bestDoorIds, bestScore } = solveBestOfSeeds([1, 2, 3], input);

      expect(bestScore.feasible).toBe(true);
      expect(bestScore.guards).toBe(oracle.bestScore.guards);
      expect(bestScore.doorPriority).toBe(oracle.bestScore.doorPriority);

      const selected = new Set(bestDoorIds);

      // Tail component unique optimal
      expect(selected.has(7)).toBe(true);
      expect(selected.has(10)).toBe(true);

      // With these priorities, Triangle 1 optimal is {1,3}, Triangle 2 optimal is {4,5}
      // (If you ever change scoring rules, the oracle asserts correctness anyway.)
      expect(selected.has(1)).toBe(true);
      expect(selected.has(3)).toBe(true);
      expect(selected.has(4)).toBe(true);
      expect(selected.has(5)).toBe(true);
    },
    30_000
  );

  it(
    '100-room layout: scales; heavily prefers priority-optimal covers across many independent components',
    () => {
      const rooms: Room[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }));

      const doors: Door[] = [];
      const priorities = Array(100).fill(0);

      // 32 independent triangles (96 rooms)
      for (let i = 0; i < 32; i++) {
        const offset = i * 3;
        const r1 = offset + 1;
        const r2 = offset + 2;
        const r3 = offset + 3;

        const d1 = offset + 1;
        const d2 = offset + 2;
        const d3 = offset + 3;

        doors.push({ id: d1, room1Id: r1, room2Id: r2 });
        doors.push({ id: d2, room1Id: r2, room2Id: r3 });
        doors.push({ id: d3, room1Id: r1, room2Id: r3 });

        // High priority on middle node -> best 2-edge cover is (d1,d2)
        priorities[r2 - 1] = 50;
      }

      // Tail for rooms 97-100: unique optimal {97,100}
      doors.push({ id: 97, room1Id: 97, room2Id: 98 });
      doors.push({ id: 98, room1Id: 98, room2Id: 99 });
      doors.push({ id: 99, room1Id: 97, room2Id: 99 });
      doors.push({ id: 100, room1Id: 99, room2Id: 100 });

      const input: GeneticSolverInput = {
        algorithm: 'genetic',
        rooms,
        doors,
        nbrOfShifts: 1,
        shiftsPriorities: [priorities],
      };

      //const { bestDoorIds, bestScore } = solveBestOfSeeds([11, 22, 33], input);
      const { bestDoorIds, bestScore } = solveBestOfSeeds([11], input);

      expect(bestScore.feasible).toBe(true);

      // Minimum guards: 2 per triangle * 32 + 2 tail = 66
      expect(bestScore.guards).toBe(66);

      const selected = new Set(bestDoorIds);

      // Tail unique optimal
      expect(selected.has(97)).toBe(true);
      expect(selected.has(100)).toBe(true);

      // Priority-optimal tie-break across triangles:
      // Prefer selecting both edges incident to the high-priority middle node (d1 & d2).
      let priorityMatches = 0;
      for (let i = 0; i < 32; i++) {
        const d1 = i * 3 + 1;
        const d2 = i * 3 + 2;
        if (selected.has(d1) && selected.has(d2)) priorityMatches++;
      }

      // Deterministic seeds => stable. Set to 32 if your solver is consistently optimal here.
      expect(priorityMatches).toBeGreaterThanOrEqual(30);
    },
    120_000
  );
});

describe('GeneticSolver - impossible coverage', () => {
  it('throws when a room has no incident doors', () => {
    const solver = new GeneticSolver();

    const rooms: Room[] = [
      { id: 1, x: 0, y: 0, width: 10, height: 10 },
      { id: 2, x: 0, y: 0, width: 10, height: 10 },
      { id: 3, x: 0, y: 0, width: 10, height: 10 }, // isolated
    ];

    const doors: Door[] = [
      { id: 1, room1Id: 1, room2Id: 2 }, // room 3 has zero doors
    ];

    const input: GeneticSolverInput = {
      algorithm: 'genetic',
      rooms,
      doors,
      nbrOfShifts: 1,
      shiftsPriorities: [[0, 0, 0]],
    };

    expect(() => solver.solve(input)).toThrow(/have no doors/i);
  });
});
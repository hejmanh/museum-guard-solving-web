import type { SolveInput, SolveOutput, SolveResult, Solver, Door, Room } from '../types';

export interface GenerationDebug {
  generation: number;
  fitness: number;
  feasible: boolean;
  guards: number;
  coveredRooms: number;
  totalRooms: number;
  scoreSummary: string;
}

type DoorRoomIdxPair = readonly [number, number];

type Score = {
  feasible: boolean;          // all rooms covered?
  uncoveredCount: number;     // # rooms not covered
  guards: number;             // selected doors
  doorPriority: number;       // tie-break among equal guards
};

interface Individual {
  genes: boolean[];
  score: Score;
  fitness: number; // for display only (debug), not relied on for correctness
}

type Params = {
  populationSize: number;
  maxGenerations: number;
  baseMutationRate: number;
  tournamentSize: number;
  elitismCount: number;
  restartStagnation: number;
  restartFraction: number;
};

const noopScore = (): Score => ({
  feasible: false,
  uncoveredCount: Number.MAX_SAFE_INTEGER,
  guards: Number.MAX_SAFE_INTEGER,
  doorPriority: 0,
});

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export class GeneticSolver implements Solver {
  private lastDebugByShift: GenerationDebug[][] = [];

  getLastDebugByShift(): ReadonlyArray<ReadonlyArray<GenerationDebug>> {
    return this.lastDebugByShift;
  }

  solve(input: SolveInput): SolveOutput {
    if (input.algorithm !== 'genetic') throw new Error('Invalid input for GeneticSolver');

    const { rooms, doors, nbrOfShifts, shiftsPriorities } = input;

    // Impossible detection (defense-in-depth; you already have UI-side too)
    const isolated = this.findIsolatedRoomIds(rooms, doors);
    if (isolated.length > 0) {
      throw new Error(
        `Impossible to cover all rooms: room(s) ${isolated.join(
          ', '
        )} have no doors. Add at least one door connected to each room.`
      );
    }

    const roomIndexById = this.buildRoomIndexById(rooms);
    const doorPairs = this.buildDoorPairs(doors, roomIndexById);
    const doorIndicesByRoomIdx = this.buildDoorAdjacency(rooms.length, doorPairs);

    const shiftCount = Math.max(1, nbrOfShifts);
    const results: SolveResult[] = [];
    this.lastDebugByShift = [];

    for (let shift = 0; shift < shiftCount; shift++) {
      const row = shiftsPriorities?.[shift] ?? [];
      const prioritiesByRoomIdx = rooms.map((_, i) => (Number.isFinite(row[i]) ? row[i] : 0));

      const { best, debug } = this.runEvolution({
        roomCount: rooms.length,
        doorPairs,
        doorIndicesByRoomIdx,
        prioritiesByRoomIdx,
      });

      this.lastDebugByShift.push(debug);

      const guardDoorIds = doors
        .filter((_, i) => best.genes[i])
        .map((d) => d.id);

      results.push({ guardDoorIds });
    }

    return { nbrOfResults: results.length, results };
  }

  // ------------------------- Core: self-tuning GA -------------------------

  private deriveParams(roomCount: number, doorCount: number): Params {
    // Self-tuning: scales with size, clamped to keep UI responsive.
    // Bigger graphs => bigger pop + more generations, but not unbounded.
    const populationSize = clamp(80 + Math.floor(1.8 * doorCount), 120, 900);
    const maxGenerations = clamp(180 + Math.floor(2.5 * roomCount), 250, 1600);

    // Mutation: larger graphs need slightly lower base mutation; stagnation handling bumps it.
    const baseMutationRate = clamp(0.12 - doorCount * 0.0002, 0.02, 0.10);

    // Selection pressure: moderate
    const tournamentSize = clamp(3 + Math.floor(doorCount / 120), 3, 7);
    const elitismCount = clamp(3 + Math.floor(populationSize / 180), 3, 10);

    // Restarts if stuck
    const restartStagnation = clamp(35 + Math.floor(roomCount / 6), 35, 120);
    const restartFraction = 0.28;

    return {
      populationSize,
      maxGenerations,
      baseMutationRate,
      tournamentSize,
      elitismCount,
      restartStagnation,
      restartFraction,
    };
  }

  private runEvolution(args: {
    roomCount: number;
    doorPairs: DoorRoomIdxPair[];
    doorIndicesByRoomIdx: number[][];
    prioritiesByRoomIdx: number[];
  }): { best: Individual; debug: GenerationDebug[] } {
    const { roomCount, doorPairs, doorIndicesByRoomIdx, prioritiesByRoomIdx } = args;
    const doorCount = doorPairs.length;

    const params = this.deriveParams(roomCount, doorCount);
    const doorPriorityByDoorIdx = this.buildDoorPriorityByDoorIdx(doorPairs, prioritiesByRoomIdx);

    let mutationRate = params.baseMutationRate;

    let population = this.initializePopulation({
      roomCount,
      doorCount,
      doorPairs,
      doorIndicesByRoomIdx,
      prioritiesByRoomIdx,
      doorPriorityByDoorIdx,
      populationSize: params.populationSize,
    });

    const debug: GenerationDebug[] = [];

    let bestSoFar: Individual | null = null;
    let stagnant = 0;

    for (let gen = 0; gen < params.maxGenerations; gen++) {
      this.evaluate(population, roomCount, doorPairs, doorPriorityByDoorIdx);

      population.sort((a, b) => this.compareIndividuals(b, a)); // best first

      const bestNow = population[0];
      if (!bestSoFar || this.compareIndividuals(bestNow, bestSoFar) > 0) {
        bestSoFar = this.cloneIndividual(bestNow);
        stagnant = 0;
        mutationRate = params.baseMutationRate;
      } else {
        stagnant++;
      }

      debug.push({
        generation: gen,
        fitness: Number.isFinite(bestNow.fitness) ? bestNow.fitness : 0,
        feasible: bestNow.score.feasible,
        guards: bestNow.score.guards,
        coveredRooms: roomCount - bestNow.score.uncoveredCount,
        totalRooms: roomCount,
        scoreSummary: this.scoreSummary(bestNow.score),
      });

      // Restart mechanism: if stuck, reseed bottom part + bump mutation briefly
      if (stagnant >= params.restartStagnation) {
        mutationRate = clamp(mutationRate * 1.7, params.baseMutationRate, 0.18);
        this.restartPopulationTail({
          population,
          roomCount,
          doorCount,
          doorPairs,
          doorIndicesByRoomIdx,
          prioritiesByRoomIdx,
          doorPriorityByDoorIdx,
          fraction: params.restartFraction,
        });
        stagnant = Math.floor(params.restartStagnation / 2);
      }

      // Early exit if we are feasible and already heavily pruned (hard to know optimal),
      // but we keep running a bit since restarts are cheap.
      if (bestSoFar?.score.feasible && stagnant >= Math.floor(params.restartStagnation * 1.2)) {
        break;
      }

      const next: Individual[] = [];

      // Elitism
      for (let i = 0; i < Math.min(params.elitismCount, population.length); i++) {
        next.push(this.cloneIndividual(population[i]));
      }

      while (next.length < params.populationSize) {
        const p1 = this.selectParent(population, params.tournamentSize);
        const p2 = this.selectParent(population, params.tournamentSize);

        const childGenes = this.crossover(p1.genes, p2.genes);
        this.mutate(childGenes, mutationRate);

        // Make feasible fast, then shrink.
        this.repairGreedy(childGenes, roomCount, doorPairs, doorIndicesByRoomIdx, prioritiesByRoomIdx);
        this.prune(childGenes, roomCount, doorPairs);

        next.push({
          genes: childGenes,
          score: noopScore(),
          fitness: 0,
        });
      }

      population = next;
    }

    // Final eval + sort
    this.evaluate(population, roomCount, doorPairs, doorPriorityByDoorIdx);
    population.sort((a, b) => this.compareIndividuals(b, a));

    return { best: population[0], debug };
  }

  // ------------------------- Population init (strong seeding) -------------------------

  private initializePopulation(args: {
    roomCount: number;
    doorCount: number;
    doorPairs: DoorRoomIdxPair[];
    doorIndicesByRoomIdx: number[][];
    prioritiesByRoomIdx: number[];
    doorPriorityByDoorIdx: number[];
    populationSize: number;
  }): Individual[] {
    const {
      roomCount,
      doorCount,
      doorPairs,
      doorIndicesByRoomIdx,
      prioritiesByRoomIdx,
      doorPriorityByDoorIdx,
      populationSize,
    } = args;

    const pop: Individual[] = [];
    if (doorCount <= 0) {
      for (let i = 0; i < populationSize; i++) {
        pop.push({ genes: [], score: noopScore(), fitness: 0 });
      }
      return pop;
    }

    // 1) Multiple greedy seeds (with small randomness)
    const greedySeeds = Math.min(12, Math.max(4, Math.floor(populationSize * 0.08)));
    for (let i = 0; i < greedySeeds; i++) {
      const genes = this.buildGreedySolution(roomCount, doorCount, doorPairs, doorIndicesByRoomIdx, prioritiesByRoomIdx, i);
      this.prune(genes, roomCount, doorPairs);
      pop.push({ genes, score: noopScore(), fitness: 0 });
    }

    // 2) One dense feasible seed (helps if greedy makes weird choices)
    const allTrue = Array<boolean>(doorCount).fill(true);
    this.prune(allTrue, roomCount, doorPairs);
    pop.push({ genes: allTrue, score: noopScore(), fitness: 0 });

    // 3) Random + repair + prune (diversity)
    const pTrue = clamp(0.35 * (roomCount / Math.max(1, doorCount)), 0.05, 0.22);
    while (pop.length < populationSize) {
      const genes = Array.from({ length: doorCount }, () => Math.random() < pTrue);
      this.repairGreedy(genes, roomCount, doorPairs, doorIndicesByRoomIdx, prioritiesByRoomIdx);
      this.prune(genes, roomCount, doorPairs);
      pop.push({ genes, score: noopScore(), fitness: 0 });
    }

    // Evaluate once for better selection right away
    this.evaluate(pop, roomCount, doorPairs, doorPriorityByDoorIdx);
    pop.sort((a, b) => this.compareIndividuals(b, a));
    return pop;
  }

  private restartPopulationTail(args: {
    population: Individual[];
    roomCount: number;
    doorCount: number;
    doorPairs: DoorRoomIdxPair[];
    doorIndicesByRoomIdx: number[][];
    prioritiesByRoomIdx: number[];
    doorPriorityByDoorIdx: number[];
    fraction: number;
  }): void {
    const {
      population,
      roomCount,
      doorCount,
      doorPairs,
      doorIndicesByRoomIdx,
      prioritiesByRoomIdx,
      doorPriorityByDoorIdx,
      fraction,
    } = args;

    const n = population.length;
    const k = Math.max(1, Math.floor(n * fraction));
    const start = n - k;

    const pTrue = clamp(0.35 * (roomCount / Math.max(1, doorCount)), 0.05, 0.25);

    for (let i = start; i < n; i++) {
      const useGreedy = Math.random() < 0.55;
      const genes = useGreedy
        ? this.buildGreedySolution(roomCount, doorCount, doorPairs, doorIndicesByRoomIdx, prioritiesByRoomIdx, i)
        : Array.from({ length: doorCount }, () => Math.random() < pTrue);

      this.repairGreedy(genes, roomCount, doorPairs, doorIndicesByRoomIdx, prioritiesByRoomIdx);
      this.prune(genes, roomCount, doorPairs);

      population[i] = { genes, score: noopScore(), fitness: 0 };
    }

    this.evaluate(population, roomCount, doorPairs, doorPriorityByDoorIdx);
    population.sort((a, b) => this.compareIndividuals(b, a));
  }

  // Greedy edge-cover-ish constructor (priority-aware tie breaks)
  private buildGreedySolution(
    roomCount: number,
    doorCount: number,
    doorPairs: DoorRoomIdxPair[],
    doorIndicesByRoomIdx: number[][],
    prioritiesByRoomIdx: number[],
    seed: number
  ): boolean[] {
    const genes = Array<boolean>(doorCount).fill(false);
    const covered = Array<boolean>(roomCount).fill(false);

    // small deterministic-ish jitter per seed
    const jitter = (x: number) => x + ((Math.sin((seed + 1) * 997 + x * 13) + 1) * 0.0005);

    let uncoveredLeft = roomCount;

    // Precompute per-room weight: base 1 + max(0, priority)
    const w = prioritiesByRoomIdx.map((p) => 1 + Math.max(0, Number.isFinite(p) ? p : 0));

    while (uncoveredLeft > 0) {
      let bestDoor = -1;
      let bestGain = -Infinity;

      for (let d = 0; d < doorCount; d++) {
        if (genes[d]) continue;
        const [a, b] = doorPairs[d];
        if (a < 0 || b < 0) continue;

        const gain =
          (covered[a] ? 0 : w[a]) +
          (covered[b] ? 0 : w[b]);

        if (gain <= 0) continue;

        const score = jitter(gain);
        if (score > bestGain) {
          bestGain = score;
          bestDoor = d;
        }
      }

      // Fallback: pick an uncovered room and an incident door
      if (bestDoor === -1) {
        let r = -1;
        for (let i = 0; i < roomCount; i++) {
          if (!covered[i]) {
            r = i;
            break;
          }
        }
        if (r === -1) break;
        const incident = doorIndicesByRoomIdx[r];
        bestDoor = incident?.[(Math.random() * incident.length) | 0] ?? -1;
        if (bestDoor === -1) break;
      }

      genes[bestDoor] = true;
      const [a, b] = doorPairs[bestDoor];
      if (a >= 0 && !covered[a]) {
        covered[a] = true;
        uncoveredLeft--;
      }
      if (b >= 0 && !covered[b]) {
        covered[b] = true;
        uncoveredLeft--;
      }
    }

    // Ensure feasibility if any uncovered remains (shouldn't, but safe)
    this.repairGreedy(genes, roomCount, doorPairs, doorIndicesByRoomIdx, prioritiesByRoomIdx);

    return genes;
  }

  // ------------------------- Evaluation & ordering (no hand-tuning penalties) -------------------------

  private evaluate(
    population: Individual[],
    roomCount: number,
    doorPairs: DoorRoomIdxPair[],
    doorPriorityByDoorIdx: number[]
  ): void {
    for (const ind of population) {
      ind.score = this.computeScore(ind.genes, roomCount, doorPairs, doorPriorityByDoorIdx);
      // fitness only for debug display (not relied on)
      ind.fitness = this.scoreToDisplayFitness(ind.score, roomCount);
    }
  }

  // Lexicographic ordering:
  // 1) Feasible beats infeasible
  // 2) If feasible: fewer guards better
  // 3) If feasible and tie guards: higher doorPriority better
  // 4) If infeasible: fewer uncovered better, then fewer guards, then higher doorPriority
  private compareIndividuals(a: Individual, b: Individual): number {
    const as = a.score;
    const bs = b.score;

    if (as.feasible !== bs.feasible) return as.feasible ? 1 : -1;

    if (as.feasible) {
      if (as.guards !== bs.guards) return bs.guards - as.guards; // fewer guards => larger compare result
      if (as.doorPriority !== bs.doorPriority) return as.doorPriority - bs.doorPriority;
      return 0;
    }

    if (as.uncoveredCount !== bs.uncoveredCount) return bs.uncoveredCount - as.uncoveredCount; // fewer uncovered => larger
    if (as.guards !== bs.guards) return bs.guards - as.guards;
    if (as.doorPriority !== bs.doorPriority) return as.doorPriority - bs.doorPriority;
    return 0;
  }

  private computeScore(
    genes: boolean[],
    roomCount: number,
    doorPairs: DoorRoomIdxPair[],
    doorPriorityByDoorIdx: number[]
  ): Score {
    const covered = Array<boolean>(roomCount).fill(false);
    let guards = 0;
    let doorPriority = 0;

    for (let i = 0; i < genes.length; i++) {
      if (!genes[i]) continue;
      guards++;
      doorPriority += doorPriorityByDoorIdx[i] ?? 0;

      const [a, b] = doorPairs[i];
      if (a >= 0) covered[a] = true;
      if (b >= 0) covered[b] = true;
    }

    let uncoveredCount = 0;
    for (let r = 0; r < roomCount; r++) if (!covered[r]) uncoveredCount++;

    return {
      feasible: uncoveredCount === 0,
      uncoveredCount,
      guards,
      doorPriority,
    };
  }

  private scoreToDisplayFitness(score: Score, roomCount: number): number {
    // Human-friendly monotonic-ish display; real ordering uses compareIndividuals().
    const covered = roomCount - score.uncoveredCount;
    const feas = score.feasible ? 1 : 0;
    return feas * 1_000_000 + covered * 1000 - score.guards * 10 + score.doorPriority * 0.01;
  }

  private scoreSummary(score: Score): string {
    if (score.feasible) return `feasible | guards=${score.guards} | doorPriority=${score.doorPriority}`;
    return `infeasible | uncovered=${score.uncoveredCount} | guards=${score.guards} | doorPriority=${score.doorPriority}`;
  }

  private cloneIndividual(ind: Individual): Individual {
    return {
      genes: [...ind.genes],
      score: { ...ind.score },
      fitness: ind.fitness,
    };
  }

  private buildDoorPriorityByDoorIdx(doorPairs: DoorRoomIdxPair[], prioritiesByRoomIdx: number[]): number[] {
    const p = prioritiesByRoomIdx.map((x) => Math.max(0, Number.isFinite(x) ? x : 0));
    return doorPairs.map(([a, b]) => (a >= 0 ? p[a] : 0) + (b >= 0 ? p[b] : 0));
  }

  // ------------------------- Selection / crossover / mutation -------------------------

  private selectParent(population: Individual[], tournamentSize: number): Individual {
    const k = Math.min(tournamentSize, population.length);
    let best = population[(Math.random() * population.length) | 0];

    for (let i = 1; i < k; i++) {
      const cand = population[(Math.random() * population.length) | 0];
      if (this.compareIndividuals(cand, best) > 0) best = cand;
    }
    return best;
  }

  private crossover(a: boolean[], b: boolean[]): boolean[] {
    const len = a.length;
    if (len <= 1) return [...a];
    const cut = 1 + ((Math.random() * (len - 1)) | 0);
    return a.slice(0, cut).concat(b.slice(cut));
  }

  private mutate(genes: boolean[], mutationRate: number): void {
    for (let i = 0; i < genes.length; i++) {
      if (Math.random() < mutationRate) genes[i] = !genes[i];
    }
  }

  // ------------------------- Repair / prune (domain power) -------------------------

  // Greedy repair: for uncovered rooms, add an incident door that covers the most uncovered weighted rooms.
  private repairGreedy(
    genes: boolean[],
    roomCount: number,
    doorPairs: DoorRoomIdxPair[],
    doorIndicesByRoomIdx: number[][],
    prioritiesByRoomIdx: number[]
  ): void {
    if (roomCount <= 0 || genes.length === 0) return;

    const covered = Array<boolean>(roomCount).fill(false);
    for (let i = 0; i < genes.length; i++) {
      if (!genes[i]) continue;
      const [a, b] = doorPairs[i];
      if (a >= 0) covered[a] = true;
      if (b >= 0) covered[b] = true;
    }

    const w = prioritiesByRoomIdx.map((p) => 1 + Math.max(0, Number.isFinite(p) ? p : 0));

    let safety = 0;
    while (safety++ < roomCount * 4) {
      let anyUncovered = false;

      for (let r = 0; r < roomCount; r++) {
        if (covered[r]) continue;
        anyUncovered = true;

        const incident = doorIndicesByRoomIdx[r];
        if (!incident || incident.length === 0) continue;

        let bestDoor = incident[0];
        let bestGain = -Infinity;

        for (const d of incident) {
          const [a, b] = doorPairs[d];
          const gain = (a >= 0 && !covered[a] ? w[a] : 0) + (b >= 0 && !covered[b] ? w[b] : 0);
          if (gain > bestGain) {
            bestGain = gain;
            bestDoor = d;
          }
        }

        genes[bestDoor] = true;
        const [a, b] = doorPairs[bestDoor];
        if (a >= 0) covered[a] = true;
        if (b >= 0) covered[b] = true;
      }

      if (!anyUncovered) break;
    }
  }

  // Prune: remove redundant doors while preserving full coverage.
  private prune(genes: boolean[], roomCount: number, doorPairs: DoorRoomIdxPair[]): void {
    if (!this.isFullyCovered(genes, roomCount, doorPairs)) return;

    const selected: number[] = [];
    for (let i = 0; i < genes.length; i++) if (genes[i]) selected.push(i);

    // Shuffle removal order
    for (let i = selected.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    for (const idx of selected) {
      genes[idx] = false;
      if (!this.isFullyCovered(genes, roomCount, doorPairs)) genes[idx] = true;
    }
  }

  private isFullyCovered(genes: boolean[], roomCount: number, doorPairs: DoorRoomIdxPair[]): boolean {
    if (roomCount <= 0) return true;
    const covered = Array<boolean>(roomCount).fill(false);

    for (let i = 0; i < genes.length; i++) {
      if (!genes[i]) continue;
      const [a, b] = doorPairs[i];
      if (a >= 0) covered[a] = true;
      if (b >= 0) covered[b] = true;
    }

    for (let r = 0; r < roomCount; r++) if (!covered[r]) return false;
    return true;
  }

  // ------------------------- Precompute helpers -------------------------

  private buildRoomIndexById(rooms: Room[]): Map<number, number> {
    const map = new globalThis.Map<number, number>();
    rooms.forEach((r, idx) => map.set(r.id, idx));
    return map;
  }

  private buildDoorPairs(doors: Door[], roomIndexById: Map<number, number>): DoorRoomIdxPair[] {
    return doors.map((d) => {
      const a = roomIndexById.get(d.room1Id);
      const b = roomIndexById.get(d.room2Id);
      return [a ?? -1, b ?? -1] as const;
    });
  }

  private buildDoorAdjacency(roomCount: number, doorPairs: DoorRoomIdxPair[]): number[][] {
    const adj: number[][] = Array.from({ length: roomCount }, () => []);
    doorPairs.forEach(([a, b], i) => {
      if (a >= 0) adj[a].push(i);
      if (b >= 0) adj[b].push(i);
    });
    return adj;
  }

  private findIsolatedRoomIds(rooms: Room[], doors: Door[]): number[] {
    const incidentCountByRoomId = new globalThis.Map<number, number>();
    for (const r of rooms) incidentCountByRoomId.set(r.id, 0);

    for (const d of doors) {
      incidentCountByRoomId.set(d.room1Id, (incidentCountByRoomId.get(d.room1Id) ?? 0) + 1);
      incidentCountByRoomId.set(d.room2Id, (incidentCountByRoomId.get(d.room2Id) ?? 0) + 1);
    }

    return rooms.filter((r) => (incidentCountByRoomId.get(r.id) ?? 0) === 0).map((r) => r.id);
  }
}
import type { SolveInput, SolveOutput, SolveResult, Solver, Door, Room } from '../types';

export interface GenerationDebug {
  generation: number;
  fitness: number;
  guards: number;
  coveredRooms: number;
  totalRooms: number;
}

interface Individual {
  genes: boolean[];
  fitness: number;
}

type DoorRoomIdxPair = readonly [number, number];

export class GeneticSolver implements Solver {
  private populationSize = 120;
  private maxGenerations = 250;
  private mutationRate = 0.05;

  private elitismCount = 4;
  private tournamentSize = 4;

  private lastDebugByShift: GenerationDebug[][] = [];

  getLastDebugByShift(): ReadonlyArray<ReadonlyArray<GenerationDebug>> {
    return this.lastDebugByShift;
  }

  solve(input: SolveInput): SolveOutput {
    if (input.algorithm !== 'genetic') {
      throw new Error('Invalid input for GeneticSolver');
    }

    const { rooms, doors, nbrOfShifts, shiftsPriorities } = input;

    // Coverage-impossible detection (defense-in-depth; UI checks too)
    const isolated = this.findIsolatedRoomIds(rooms, doors);
    if (isolated.length > 0) {
      throw new Error(
        `Impossible to cover all rooms: room(s) ${isolated.join(
          ', '
        )} have no doors. Add at least one door connected to each room.`
      );
    }

    const results: SolveResult[] = [];
    const shiftCount = Math.max(1, nbrOfShifts);
    this.lastDebugByShift = [];

    for (let shift = 0; shift < shiftCount; shift++) {
      const row = shiftsPriorities?.[shift] ?? [];
      const priorities = rooms.map((_, i) => (Number.isFinite(row[i]) ? row[i] : 0));

      const { best, debug } = this.runEvolution(rooms, doors, priorities);
      this.lastDebugByShift.push(debug);

      const guardDoorIds = doors
        .filter((_, i) => best.genes[i])
        .map((d) => d.id);

      results.push({ guardDoorIds });
    }

    return { nbrOfResults: results.length, results };
  }

  private runEvolution(rooms: Room[], doors: Door[], priorities: number[]): { best: Individual; debug: GenerationDebug[] } {
    const roomIndexById = this.buildRoomIndexById(rooms);
    const doorPairs = this.buildDoorPairs(doors, roomIndexById);
    const doorIndicesByRoomIdx = this.buildDoorAdjacency(rooms.length, doorPairs);
    const roomWeights = this.buildRoomWeights(rooms.length, priorities);

    let population = this.initializePopulation(
      doors.length,
      rooms.length,
      doorPairs,
      doorIndicesByRoomIdx
    );

    const debug: GenerationDebug[] = [];

    let bestSoFar: Individual | null = null;
    let stagnant = 0;

    for (let gen = 0; gen < this.maxGenerations; gen++) {
      this.evaluateFitness(population, rooms.length, doorPairs, roomWeights);
      population.sort((a, b) => b.fitness - a.fitness);

      const bestNow = population[0];
      debug.push({
        generation: gen,
        fitness: bestNow.fitness,
        guards: this.countGuards(bestNow.genes),
        coveredRooms: this.countCoveredRooms(bestNow.genes, rooms.length, doorPairs),
        totalRooms: rooms.length,
      });

      if (!bestSoFar || bestNow.fitness > bestSoFar.fitness) {
        bestSoFar = { genes: [...bestNow.genes], fitness: bestNow.fitness };
        stagnant = 0;
      } else {
        stagnant++;
      }

      if (stagnant >= 40 && this.isFullyCovered(bestSoFar.genes, rooms.length, doorPairs)) {
        break;
      }

      const next: Individual[] = [];
      for (let i = 0; i < Math.min(this.elitismCount, population.length); i++) {
        next.push({ genes: [...population[i].genes], fitness: population[i].fitness });
      }

      while (next.length < this.populationSize) {
        const p1 = this.selectParent(population);
        const p2 = this.selectParent(population);

        const childGenes = this.crossover(p1, p2);
        this.mutate(childGenes);

        this.repair(childGenes, rooms.length, doorPairs, doorIndicesByRoomIdx);
        this.prune(childGenes, rooms.length, doorPairs);

        next.push({ genes: childGenes, fitness: 0 });
      }

      population = next;
    }

    this.evaluateFitness(population, rooms.length, doorPairs, roomWeights);
    population.sort((a, b) => b.fitness - a.fitness);

    return { best: population[0], debug };
  }

  private initializePopulation(
    chromosomeLength: number,
    roomCount: number,
    doorPairs: DoorRoomIdxPair[],
    doorIndicesByRoomIdx: number[][]
  ): Individual[] {
    const pop: Individual[] = [];
    if (chromosomeLength <= 0) {
      for (let i = 0; i < this.populationSize; i++) pop.push({ genes: [], fitness: 0 });
      return pop;
    }

    const allTrue = Array<boolean>(chromosomeLength).fill(true);
    this.repair(allTrue, roomCount, doorPairs, doorIndicesByRoomIdx);
    this.prune(allTrue, roomCount, doorPairs);
    pop.push({ genes: allTrue, fitness: 0 });

    while (pop.length < this.populationSize) {
      const genes = Array.from({ length: chromosomeLength }, () => Math.random() < 0.22);
      this.repair(genes, roomCount, doorPairs, doorIndicesByRoomIdx);
      this.prune(genes, roomCount, doorPairs);
      pop.push({ genes, fitness: 0 });
    }

    return pop;
  }

  private evaluateFitness(
    population: Individual[],
    roomCount: number,
    doorPairs: DoorRoomIdxPair[],
    roomWeights: number[]
  ): void {
    const BIG_BONUS = 1_000_000;
    const COVER_SCALE = 500;
    const GUARD_PENALTY = 250;
    const UNCOVERED_PENALTY = 50_000;

    for (const ind of population) {
      const covered = this.computeCoveredRooms(ind.genes, roomCount, doorPairs);

      let coveredWeight = 0;
      let uncoveredWeight = 0;
      for (let i = 0; i < roomCount; i++) {
        if (covered[i]) coveredWeight += roomWeights[i];
        else uncoveredWeight += roomWeights[i];
      }

      const guardCount = this.countGuards(ind.genes);

      if (uncoveredWeight === 0) {
        ind.fitness = BIG_BONUS + coveredWeight * COVER_SCALE - guardCount * GUARD_PENALTY;
      } else {
        ind.fitness =
          coveredWeight * (COVER_SCALE * 0.1) -
          uncoveredWeight * UNCOVERED_PENALTY -
          guardCount * GUARD_PENALTY;
      }
    }
  }

  private selectParent(population: Individual[]): Individual {
    const k = Math.min(this.tournamentSize, population.length);
    let best = population[(Math.random() * population.length) | 0];
    for (let i = 1; i < k; i++) {
      const cand = population[(Math.random() * population.length) | 0];
      if (cand.fitness > best.fitness) best = cand;
    }
    return best;
  }

  private crossover(parent1: Individual, parent2: Individual): boolean[] {
    const len = parent1.genes.length;
    if (len <= 1) return [...parent1.genes];

    const cut = 1 + ((Math.random() * (len - 1)) | 0);
    return parent1.genes.slice(0, cut).concat(parent2.genes.slice(cut));
  }

  private mutate(genes: boolean[]): void {
    for (let i = 0; i < genes.length; i++) {
      if (Math.random() < this.mutationRate) genes[i] = !genes[i];
    }
  }

  private repair(
    genes: boolean[],
    roomCount: number,
    doorPairs: DoorRoomIdxPair[],
    doorIndicesByRoomIdx: number[][]
  ): void {
    if (roomCount <= 0 || genes.length === 0) return;

    const covered = this.computeCoveredRooms(genes, roomCount, doorPairs);

    let progressed = true;
    let safety = 0;
    while (progressed && safety++ < roomCount * 3) {
      progressed = false;

      for (let r = 0; r < roomCount; r++) {
        if (covered[r]) continue;

        const incident = doorIndicesByRoomIdx[r];
        if (!incident || incident.length === 0) continue;

        const pick = incident[(Math.random() * incident.length) | 0];
        if (!genes[pick]) {
          genes[pick] = true;
          const [a, b] = doorPairs[pick];
          if (a >= 0) covered[a] = true;
          if (b >= 0) covered[b] = true;
          progressed = true;
        }
      }
    }
  }

  private prune(genes: boolean[], roomCount: number, doorPairs: DoorRoomIdxPair[]): void {
    if (!this.isFullyCovered(genes, roomCount, doorPairs)) return;

    const indices: number[] = [];
    for (let i = 0; i < genes.length; i++) if (genes[i]) indices.push(i);

    for (let i = indices.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (const idx of indices) {
      genes[idx] = false;
      if (!this.isFullyCovered(genes, roomCount, doorPairs)) genes[idx] = true;
    }
  }

  private buildRoomIndexById(rooms: Room[]): Map<number, number> {
    const map = new Map<number, number>();
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

  private buildRoomWeights(roomCount: number, priorities: number[]): number[] {
    const weights = new Array<number>(roomCount);
    for (let i = 0; i < roomCount; i++) {
      const p = Number.isFinite(priorities?.[i]) ? (priorities[i] as number) : 0;
      weights[i] = 1 + Math.max(0, p);
    }
    return weights;
  }

  private computeCoveredRooms(
    genes: boolean[],
    roomCount: number,
    doorPairs: DoorRoomIdxPair[]
  ): boolean[] {
    const covered = Array<boolean>(roomCount).fill(false);
    for (let i = 0; i < genes.length; i++) {
      if (!genes[i]) continue;
      const [a, b] = doorPairs[i];
      if (a >= 0) covered[a] = true;
      if (b >= 0) covered[b] = true;
    }
    return covered;
  }

  private isFullyCovered(genes: boolean[], roomCount: number, doorPairs: DoorRoomIdxPair[]): boolean {
    if (roomCount <= 0) return true;
    const covered = this.computeCoveredRooms(genes, roomCount, doorPairs);
    for (let i = 0; i < roomCount; i++) if (!covered[i]) return false;
    return true;
  }

  private countCoveredRooms(genes: boolean[], roomCount: number, doorPairs: DoorRoomIdxPair[]): number {
    const covered = this.computeCoveredRooms(genes, roomCount, doorPairs);
    let c = 0;
    for (let i = 0; i < roomCount; i++) if (covered[i]) c++;
    return c;
  }

  private countGuards(genes: boolean[]): number {
    let c = 0;
    for (const g of genes) if (g) c++;
    return c;
  }

  private findIsolatedRoomIds(rooms: Room[], doors: Door[]): number[] {
    const incidentCountByRoomId = new Map<number, number>();
    for (const r of rooms) incidentCountByRoomId.set(r.id, 0);

    for (const d of doors) {
      incidentCountByRoomId.set(d.room1Id, (incidentCountByRoomId.get(d.room1Id) ?? 0) + 1);
      incidentCountByRoomId.set(d.room2Id, (incidentCountByRoomId.get(d.room2Id) ?? 0) + 1);
    }

    return rooms
      .filter((r) => (incidentCountByRoomId.get(r.id) ?? 0) === 0)
      .map((r) => r.id);
  }
}
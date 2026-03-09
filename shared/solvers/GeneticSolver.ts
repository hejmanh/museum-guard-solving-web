import { SolveInput, SolveOutput, SolveResult, Solver, GeneticSolverInput, Door, Room } from '../types';

interface Individual {
  genes: boolean[]; // true if guard is at door[index]
  fitness: number;
}

export class GeneticSolver implements Solver {
  // GA parameters (tweaked later)
  private populationSize = 100;
  private maxGenerations = 200;
  private mutationRate = 0.05;

  solve(input: SolveInput): SolveOutput {
    // Narrow down the type to access GA-specific inputs
    if (input.algorithm !== 'genetic') {
      throw new Error('Invalid input for GeneticSolver');
    }
    
    const { rooms, doors, nbrOfShifts, shiftsPriorities } = input as GeneticSolverInput;
    const results: SolveResult[] = [];

    // Since we have multiple shifts, we can run the GA for each shift
    // taking into account the specific room priorities for that shift
    for (let shift = 0; shift < nbrOfShifts; shift++) {
      const priorities = shiftsPriorities[shift] || [];
      const bestIndividual = this.runEvolution(rooms, doors, priorities);
      
      // Convert the best individual's boolean array back to door IDs
      const guardDoorIds = doors
        .filter((_, index) => bestIndividual.genes[index])
        .map(door => door.id);

      results.push({ guardDoorIds });
    }

    return {
      nbrOfResults: results.length,
      results: results,
    };
  }

  private runEvolution(rooms: Room[], doors: Door[], priorities: number[]): Individual {
    let population = this.initializePopulation(doors.length);

    for (let generation = 0; generation < this.maxGenerations; generation++) {
      // 1. Calculate Fitness
      this.evaluateFitness(population, rooms, doors, priorities);

      // 2. Sort by fitness (descending)
      population.sort((a, b) => b.fitness - a.fitness);

      // Early stopping if we find a perfect/good enough solution can go here

      // 3. Selection & Crossover
      const newPopulation: Individual[] = [];
      // Keep elitism (best few individuals carry over)
      newPopulation.push(population[0], population[1]); 

      while (newPopulation.length < this.populationSize) {
        const parent1 = this.selectParent(population);
        const parent2 = this.selectParent(population);
        const childGenes = this.crossover(parent1, parent2);
        
        // 4. Mutation
        this.mutate(childGenes);
        
        newPopulation.push({ genes: childGenes, fitness: 0 });
      }

      population = newPopulation;
    }

    // Final evaluation to ensure the best is at index 0
    this.evaluateFitness(population, rooms, doors, priorities);
    population.sort((a, b) => b.fitness - a.fitness);

    return population[0];
  }

  // --- GA Component Methods to Implement ---

  private initializePopulation(chromosomeLength: number): Individual[] {
    // TODO: Create an initial population with random true/false arrays
    return []; 
  }

  private evaluateFitness(population: Individual[], rooms: Room[], doors: Door[], priorities: number[]): void {
    // TODO: Loop through population.
    // 1. Check how many rooms are covered by the selected doors.
    // 2. Factor in the room `priorities` (e.g., covering a high-priority room yields more points).
    // 3. Penalize using too many guards (you want to minimize doors used while maximizing coverage).
  }

  private selectParent(population: Individual[]): Individual {
    // TODO: Implement Roulette Wheel or Tournament Selection
    return population[0];
  }

  private crossover(parent1: Individual, parent2: Individual): boolean[] {
    // TODO: Implement Single-Point or Uniform Crossover
    return [];
  }

  private mutate(genes: boolean[]): void {
    // TODO: Loop through genes, randomly flip boolean based on this.mutationRate
  }
}
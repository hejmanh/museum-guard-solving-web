import type { GenerationDebug } from '../solvers/GeneticSolver';

export interface ChartDataPoint {
  generation: number;
  feasible: boolean;
  guards: number;
  coveredRooms: number;
  totalRooms: number;
  metric: number;
  metricLabel: string;
}

export function buildChartData(debugRows: ReadonlyArray<GenerationDebug>): ChartDataPoint[] {
  return debugRows.map((row) => {
    const metric = row.feasible ? row.guards : row.coveredRooms;
    return {
      generation: row.generation,
      feasible: row.feasible,
      guards: row.guards,
      coveredRooms: row.coveredRooms,
      totalRooms: row.totalRooms,
      metric,
      metricLabel: row.feasible ? 'Guards (feasible)' : 'Covered rooms (infeasible)',
    };
  });
}

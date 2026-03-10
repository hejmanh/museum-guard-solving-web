'use client';

import type { ChartDataPoint } from '@/shared/utils/buildChartData';

export default function GaTelemetryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDataPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm">
      <div className="font-semibold text-gray-800">Gen {d.generation}</div>
      <div className="text-gray-700">{d.feasible ? 'feasible' : 'infeasible'}</div>
      <div className="text-gray-700">
        Covered: {d.coveredRooms}/{d.totalRooms}
      </div>
      <div className="text-gray-700">Guards: {d.guards}</div>
      <div className="text-gray-800 font-semibold">
        {d.metricLabel}: {d.metric}
      </div>
    </div>
  );
}

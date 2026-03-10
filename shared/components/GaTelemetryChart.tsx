'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import GaTelemetryTooltip from './GaTelemetryTooltip';
import type { ChartDataPoint } from '@/shared/utils/buildChartData';

interface GaTelemetryChartProps {
  chartData: ChartDataPoint[];
}

export default function GaTelemetryChart({ chartData }: GaTelemetryChartProps) {
  return (
    <div className="mb-3 rounded border border-gray-200 bg-white px-3 py-2">
      <div className="text-sm font-semibold text-gray-700">GA telemetry (best-so-far)</div>
      <div className="mt-2 h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="generation" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip content={<GaTelemetryTooltip />} />
            <Line type="monotone" dataKey="metric" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-xs text-gray-500">
        Y shows <span className="font-semibold">Covered rooms</span> until feasible, then switches to{' '}
        <span className="font-semibold">Guards</span> to visualize pruning.
      </div>
    </div>
  );
}

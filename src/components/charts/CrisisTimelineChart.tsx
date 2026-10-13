import {
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "../../models/types";
import { CardHead } from "../cards/CardHead";

export type CrisisTimelineChartProps = {
  data: ChartPoint[];
};

export function CrisisTimelineChart({ data }: CrisisTimelineChartProps) {
  return (
    <article className="card">
      <CardHead
        title="Crisis timeline"
        help="Current API activity window with forecast context."
      />
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <ReferenceLine y={data[0]?.baseline ?? 0} stroke="var(--muted)" strokeDasharray="4 4" label="Baseline" />
          <ReferenceLine x={data[Math.max(0, data.length - 4)]?.name} stroke="var(--amber)" label="Spike detected" />
          <ReferenceDot x={data[data.length - 2]?.name} y={data[data.length - 2]?.mentions} r={5} fill="var(--red)" label="Critical" />
          <Line
            dataKey="mentions"
            stroke="var(--indigo)"
            strokeWidth={3}
            dot={false}
          />
          <Line dataKey="forecast" stroke="var(--amber)" strokeWidth={2} strokeDasharray="6 5" dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-markers"><span>Spike detected</span><span>Critical</span><span>Predicted: CRITICAL in 2h</span></div>
    </article>
  );
}

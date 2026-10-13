import {
  Line,
  LineChart,
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
          <Line
            dataKey="mentions"
            stroke="var(--indigo)"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </article>
  );
}

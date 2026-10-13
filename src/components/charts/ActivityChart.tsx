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

export type ActivityChartProps = {
  data: ChartPoint[];
};

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <article className="card chart-card">
      <CardHead
        title="Mention activity"
        help="Volume and negative sentiment from current API data."
        actions={
          <div className="chart-legend">
            <span>
              <i className="legend-dot indigo" />
              mentions
            </span>
            <span>
              <i className="legend-dot red" />
              negative
            </span>
          </div>
        }
      />
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          />
          <Line
            type="monotone"
            dataKey="mentions"
            stroke="var(--indigo)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="negative"
            stroke="var(--red)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="chart-markers">
        <span>● elevated</span>
        <span>◆ prediction</span>
        <span>▲ critical</span>
      </div>
    </article>
  );
}

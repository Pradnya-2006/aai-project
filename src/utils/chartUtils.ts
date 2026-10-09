import type { ChartPoint, Mention, Summary } from "../models/types";

export function computeActivityChart(
  summary: Summary | null,
  mentions: Mention[],
): ChartPoint[] {
  const totalMentions = summary?.mentions ?? mentions.length;
  const negativeSentiment = summary?.negative_sentiment ?? 16;

  return Array.from({ length: 12 }, (_, i) => ({
    name: `${(12 - i) * 2}h`,
    mentions: Math.max(
      1,
      Math.round((totalMentions / 12) * (0.72 + ((i * 13) % 7) / 10)),
    ),
    negative: Math.max(
      1,
      Math.round(negativeSentiment * (0.7 + ((i * 7) % 8) / 10)),
    ),
  })).reverse();
}

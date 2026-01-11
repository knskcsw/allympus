"use client";

import { format } from "date-fns";

type Series = {
  label: string;
  color: string;
  data: number[];
};

type EvmLineChartProps = {
  dates: string[];
  series: Series[];
};

function buildPoints(data: number[], maxValue: number) {
  const height = 60;
  const padding = 6;
  const availableHeight = height - padding * 2;
  const count = data.length;
  if (count === 1) {
    return `50,${height - padding}`;
  }
  return data
    .map((value, index) => {
      const x = (index / (count - 1)) * 100;
      const ratio = maxValue === 0 ? 0 : value / maxValue;
      const y = padding + (1 - ratio) * availableHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function EvmLineChart({ dates, series }: EvmLineChartProps) {
  const maxValue = Math.max(
    1,
    ...series.flatMap((line) => line.data)
  );

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  return (
    <div className="space-y-2">
      <svg
        className="w-full h-40"
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="54" x2="100" y2="54" stroke="currentColor" className="text-muted/30" />
        <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" className="text-muted/20" />
        <line x1="0" y1="6" x2="100" y2="6" stroke="currentColor" className="text-muted/20" />
        {series.map((line) => (
          <polyline
            key={line.label}
            points={buildPoints(line.data, maxValue)}
            fill="none"
            stroke={line.color}
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{firstDate ? format(new Date(firstDate), "M/d") : "-"}</span>
        <span>{lastDate ? format(new Date(lastDate), "M/d") : "-"}</span>
      </div>
    </div>
  );
}

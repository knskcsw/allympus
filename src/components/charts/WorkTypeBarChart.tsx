"use client";

import { useState } from "react";

type BarData = {
  category: "PV" | "BAC" | "AC" | "Forecast";
  value: number;
};

type WorkTypeBarChartProps = {
  data: BarData[];
  workTypeLabel: string;
  colors: Record<string, string>;
};

const height = 240;
const padding = { top: 12, right: 12, bottom: 48, left: 40 };
const chartHeight = height - padding.top - padding.bottom;
const chartWidth = 100 - ((padding.left + padding.right) / 400) * 100;

const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

export default function WorkTypeBarChart({
  data,
  workTypeLabel,
  colors,
}: WorkTypeBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const barCount = data.length;
  const barWidth = chartWidth / (barCount * 2);
  const barSpacing = barWidth;

  const getBarX = (index: number) => {
    const leftPadding = (padding.left / 400) * 100;
    return leftPadding + barSpacing + index * (barWidth + barSpacing);
  };

  const getBarHeight = (value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    return (clampedValue / 100) * chartHeight;
  };

  const getBarY = (value: number) => {
    const barHeight = getBarHeight(value);
    return padding.top + (chartHeight - barHeight);
  };

  const getCategoryColor = (category: string) => {
    const key = category.toLowerCase() as keyof typeof colors;
    return colors[key] || "#94a3b8";
  };

  const gridLines = [0, 25, 50, 75, 100];
  const getYForPercentage = (percentage: number) => {
    return padding.top + chartHeight - (percentage / 100) * chartHeight;
  };

  const handleMouseEnter = (index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border bg-background p-4">
        <svg
          className="h-60 w-full"
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
        >
          {gridLines.map((percentage) => {
            const y = getYForPercentage(percentage);
            return (
              <g key={`grid-${percentage}`}>
                <line
                  x1={(padding.left / 400) * 100}
                  x2={100 - (padding.right / 400) * 100}
                  y1={y}
                  y2={y}
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="0.5"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={(padding.left / 400) * 100 - 2}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[3px]"
                >
                  {percentage}%
                </text>
              </g>
            );
          })}

          {data.map((bar, index) => {
            const x = getBarX(index);
            const y = getBarY(bar.value);
            const h = getBarHeight(bar.value);
            const color = getCategoryColor(bar.category);
            const isActive = activeIndex === index;

            return (
              <g key={`bar-${bar.category}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  fill={color}
                  opacity={isActive ? 1 : 0.85}
                  className="transition-opacity cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(index)}
                  onMouseLeave={handleMouseLeave}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className="fill-foreground text-[3.5px] font-medium"
                >
                  {bar.category}
                </text>
              </g>
            );
          })}
        </svg>

        {activeIndex !== null && (() => {
          const bar = data[activeIndex];
          const x = getBarX(activeIndex);
          const barCenterPercent = ((x + barWidth / 2) / 100);

          return (
            <div
              className="pointer-events-none absolute top-8 z-10 rounded-md border bg-background/95 px-3 py-2 text-xs shadow-md whitespace-nowrap"
              style={{
                left: `${barCenterPercent * 100}%`,
                transform: "translateX(-50%)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: getCategoryColor(bar.category) }}
                />
                <span className="font-semibold">{bar.category}</span>
                <span className="ml-2 font-bold text-foreground">
                  {formatPercentage(bar.value)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

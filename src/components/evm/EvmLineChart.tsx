"use client";

import { useRef, useState, type MouseEvent } from "react";
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

const chartHeight = 60;
const chartPadding = 6;
const chartBaseline = chartHeight - chartPadding;

type ChartPoint = {
  x: number;
  y: number;
  value: number;
};

function buildPointList(data: number[], maxValue: number) {
  const availableHeight = chartHeight - chartPadding * 2;
  const count = data.length;
  if (count === 0) {
    return [] as ChartPoint[];
  }
  return data.map((value, index) => {
    const x = count === 1 ? 50 : (index / (count - 1)) * 100;
    const ratio = maxValue === 0 ? 0 : value / maxValue;
    const y = chartPadding + (1 - ratio) * availableHeight;
    return { x, y, value };
  });
}

export default function EvmLineChart({ dates, series }: EvmLineChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(1, ...series.flatMap((line) => line.data));
  const lineData = series.map((line) => {
    const values = buildPointList(line.data, maxValue);
    const points = values
      .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(" ");
    const areaPath =
      values.length > 0
        ? `M ${values[0].x.toFixed(2)} ${chartBaseline.toFixed(2)} L ${values
            .map((point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
            .join(" ")} L ${values[values.length - 1].x.toFixed(2)} ${chartBaseline.toFixed(2)} Z`
        : "";
    return { ...line, values, points, areaPath };
  });

  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const hoveredDate = hoveredIndex !== null ? dates[hoveredIndex] : null;
  const hoverX =
    hoveredIndex !== null && dates.length > 0
      ? dates.length === 1
        ? 50
        : (hoveredIndex / (dates.length - 1)) * 100
      : null;
  const tooltipX = hoverX === null ? 50 : Math.min(95, Math.max(5, hoverX));

  const handleMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || dates.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (dates.length - 1));
    const clamped = Math.min(dates.length - 1, Math.max(0, index));
    setHoveredIndex(clamped);
  };

  const handleLeave = () => {
    setHoveredIndex(null);
  };

  return (
    <div className="space-y-3">
      <div
        ref={chartRef}
        className="relative rounded-xl border bg-gradient-to-br from-muted/40 via-background to-muted/20 p-4 shadow-sm"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <svg
          className="w-full h-44"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
        >
          <defs>
            {lineData.map((line) => (
              <linearGradient
                key={`${line.label}-fill`}
                id={`${line.label}-fill`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={line.color} stopOpacity="0.42" />
                <stop offset="70%" stopColor={line.color} stopOpacity="0.18" />
                <stop offset="100%" stopColor={line.color} stopOpacity="0.12" />
              </linearGradient>
            ))}
          </defs>
          <line
            x1="0"
            y1={chartBaseline}
            x2="100"
            y2={chartBaseline}
            stroke="currentColor"
            className="text-muted/40"
          />
          <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" className="text-muted/20" />
          <line x1="0" y1={chartPadding} x2="100" y2={chartPadding} stroke="currentColor" className="text-muted/10" />
          {lineData.map((line) => (
            <g key={line.label}>
              {line.areaPath ? (
                <path d={line.areaPath} fill={`url(#${line.label}-fill)`} />
              ) : null}
              <polyline
                points={line.points}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          ))}
          {hoverX !== null ? (
            <line
              x1={hoverX}
              y1={chartPadding}
              x2={hoverX}
              y2={chartBaseline}
              stroke="currentColor"
              className="text-muted/40"
              strokeDasharray="2 2"
            />
          ) : null}
          {hoveredIndex !== null
            ? lineData.map((line) => {
                const point = line.values[hoveredIndex];
                if (!point) return null;
                return (
                  <g key={`${line.label}-point`}>
                    <circle cx={point.x} cy={point.y} r="3.5" fill="white" />
                    <circle cx={point.x} cy={point.y} r="2.4" fill={line.color} />
                  </g>
                );
              })
            : null}
        </svg>
        {hoveredDate ? (
          <div
            className="pointer-events-none absolute top-3 -translate-x-1/2 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-md backdrop-blur"
            style={{ left: `${tooltipX}%` }}
          >
            <div className="font-medium">{format(new Date(hoveredDate), "M/d")}</div>
            <div className="mt-1 space-y-0.5 text-muted-foreground">
              {lineData.map((line) => {
                const point = line.values[hoveredIndex ?? 0];
                return (
                  <div key={`${line.label}-tooltip`} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
                    <span>{line.label}</span>
                    <span className="ml-auto font-medium text-foreground">
                      {point ? point.value.toFixed(1) : "0.0"}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{firstDate ? format(new Date(firstDate), "M/d") : "-"}</span>
        <span>{lastDate ? format(new Date(lastDate), "M/d") : "-"}</span>
      </div>
    </div>
  );
}

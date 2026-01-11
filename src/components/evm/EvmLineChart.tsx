"use client";

import { useEffect, useRef, useState } from "react";
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

type ChartPoint = {
  x: number;
  y: number;
  value: number;
};

const height = 120;
const padding = 12;

const toId = (label: string) => `evm-${label.toLowerCase().replace(/\s+/g, "-")}`;

export default function EvmLineChart({ dates, series }: EvmLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });

  const values = series.flatMap((line) => line.data);
  const maxValue = Math.max(1, ...values);
  const count = dates.length;
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  const getPoint = (line: Series, index: number): ChartPoint => {
    const value = line.data[index] ?? 0;
    const ratio = maxValue === 0 ? 0 : value / maxValue;
    const clamped = Math.max(0, Math.min(1, ratio));
    const y = padding + (1 - clamped) * (height - padding * 2);
    const x = count === 1 ? 50 : (index / (count - 1)) * 100;
    return { x, y, value };
  };

  const lineSeries = series.map((line) => {
    const points = dates.map((_, index) => getPoint(line, index));
    const linePoints = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    const areaPath = points.length
      ? `M ${points[0].x},${height - padding} L ${linePoints} L ${points[points.length - 1].x},${
          height - padding
        } Z`
      : "";
    return {
      ...line,
      points,
      linePoints,
      areaPath,
      id: toId(line.label),
    };
  });

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || count === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const ratio = rect.width === 0 ? 0 : x / rect.width;
    const index = Math.round(ratio * (count - 1));
    setActiveIndex(Math.min(Math.max(index, 0), count - 1));
    setHoverX(x);
  };

  const handleLeave = () => {
    setActiveIndex(null);
  };

  useEffect(() => {
    const element = plotRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setPlotSize({ width: rect.width, height: rect.height });
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={chartRef}
        className="relative rounded-xl border bg-background p-4"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <div ref={plotRef} className="relative h-48 w-full">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              {lineSeries.map((line) => (
                <g key={`${line.id}-defs`}>
                  <linearGradient id={`${line.id}-area`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={line.color} stopOpacity="0.32" />
                    <stop offset="100%" stopColor={line.color} stopOpacity="0.04" />
                  </linearGradient>
                  <linearGradient id={`${line.id}-line`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor={line.color} />
                    <stop offset="100%" stopColor={line.color} />
                  </linearGradient>
                </g>
              ))}
            </defs>
            <rect x="0" y="0" width="100" height={height} fill="transparent" />
            <line x1="0" y1={height - padding} x2="100" y2={height - padding} stroke="rgba(148,163,184,0.4)" />
            <line x1="0" y1={height / 2} x2="100" y2={height / 2} stroke="rgba(148,163,184,0.25)" />
            {lineSeries.map((line) => (
              <g key={line.id}>
                {line.areaPath ? <path d={line.areaPath} fill={`url(#${line.id}-area)`} /> : null}
                {line.linePoints ? (
                  <polyline
                    points={line.linePoints}
                    fill="none"
                    stroke={`url(#${line.id}-line)`}
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ) : null}
              </g>
            ))}
            {activeIndex !== null ? (
              <line
                x1={lineSeries[0]?.points[activeIndex]?.x ?? 0}
                x2={lineSeries[0]?.points[activeIndex]?.x ?? 0}
                y1={padding}
                y2={height - padding}
                stroke="rgba(148,163,184,0.35)"
                strokeDasharray="2 4"
              />
            ) : null}
          </svg>
          <div className="pointer-events-none absolute inset-0">
            {lineSeries.map((line) =>
              line.points.map((point, index) => {
                const left = plotSize.width ? (point.x / 100) * plotSize.width : 0;
                const top = plotSize.height ? (point.y / height) * plotSize.height : 0;
                return (
                  <div
                    key={`${line.id}-${index}`}
                    className={[
                      "absolute rounded-full ring-1 ring-white/80",
                      index === activeIndex ? "h-3 w-3" : "h-1.5 w-1.5",
                    ].join(" ")}
                    style={{
                      left,
                      top,
                      backgroundColor: line.color,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
        {activeIndex !== null && (() => {
          const anchor = lineSeries[0]?.points[activeIndex];
          const tooltipTop = plotSize.height ? ((anchor?.y ?? 0) / height) * plotSize.height : 0;
          const toRight = hoverX < (plotSize.width || 0) * 0.7;
          return (
            <div
              className="pointer-events-none absolute top-2 z-10 rounded-md border bg-background/95 px-3 py-2 text-xs shadow-md whitespace-nowrap"
              style={{
                left: `${hoverX}px`,
                top: `${tooltipTop}px`,
                transform: toRight
                  ? "translate(32px, 28px)"
                  : "translate(calc(-100% - 32px), 28px)",
              }}
            >
              <div className="text-muted-foreground">
                {dates[activeIndex] ? format(new Date(dates[activeIndex]), "M/d (EEE)") : "--"}
              </div>
              <div className="mt-1 space-y-0.5 text-sm font-semibold text-foreground">
                {lineSeries.map((line) => {
                  const point = line.points[activeIndex];
                  return (
                    <div key={`${line.id}-tooltip`} className="flex items-center gap-2 text-xs font-normal">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
                      <span>{line.label}</span>
                      <span className="ml-auto font-semibold">{point ? `${point.value.toFixed(1)}h` : "0.0h"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{firstDate ? format(new Date(firstDate), "M/d") : "-"}</span>
        <span>{lastDate ? format(new Date(lastDate), "M/d") : "-"}</span>
      </div>
    </div>
  );
}

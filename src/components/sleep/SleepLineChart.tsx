"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

type SleepPoint = {
  date: Date;
  hours: number | null;
};

type SleepLineChartProps = {
  data: SleepPoint[];
  targetHours: number;
};

export default function SleepLineChart({
  data,
  targetHours,
}: SleepLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [plotSize, setPlotSize] = useState({ width: 0, height: 0 });
  const height = 120;
  const padding = 12;
  const values = data
    .map((item) => item.hours)
    .filter((value): value is number => value !== null);
  const maxValue = Math.max(targetHours, ...values, 1);
  const firstDate = data[0]?.date;
  const lastDate = data[data.length - 1]?.date;
  const count = data.length;

  const getPoint = (index: number) => {
    const point = data[index];
    const ratio =
      point?.hours === null || point?.hours === undefined
        ? 0
        : point.hours / maxValue;
    const clamped = Math.max(0, Math.min(1, ratio));
    const y = padding + (1 - clamped) * (height - padding * 2);
    const x = count === 1 ? 50 : (index / (count - 1)) * 100;
    return {
      x,
      y,
      ratio: clamped,
      hours: point?.hours ?? null,
      date: point?.date ?? null,
    };
  };

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

  const targetOffset = Math.max(
    padding,
    Math.min(height - padding, padding + (1 - targetHours / maxValue) * (height - padding * 2))
  );

  const points = data.map((_, index) => getPoint(index));
  const linePoints = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const areaPath = points.length
    ? `M ${points[0].x},${height - padding} L ${linePoints} L ${points[points.length - 1].x},${height - padding} Z`
    : "";

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
            <linearGradient id="sleepArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8f7bff" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#8f7bff" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="sleepLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#7c6cff" />
              <stop offset="100%" stopColor="#a08bff" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100" height={height} fill="transparent" />
          <line x1="0" y1={height - padding} x2="100" y2={height - padding} stroke="rgba(148,163,184,0.4)" />
          <line x1="0" y1={height / 2} x2="100" y2={height / 2} stroke="rgba(148,163,184,0.25)" />
          {targetHours > 0 && (
            <line
              x1="0"
              x2="100"
              y1={targetOffset}
              y2={targetOffset}
              stroke="rgba(139,92,246,0.6)"
              strokeDasharray="3 4"
            />
          )}
          {areaPath ? <path d={areaPath} fill="url(#sleepArea)" /> : null}
          {linePoints && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="url(#sleepLine)"
              strokeWidth="2.6"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {activeIndex !== null && (() => {
            const point = getPoint(activeIndex);
            return (
              <g>
                <line
                  x1={point.x}
                  x2={point.x}
                  y1={padding}
                  y2={height - padding}
                  stroke="rgba(186,146,255,0.4)"
                  strokeDasharray="2 4"
                />
              </g>
            );
          })()}
        </svg>
        <div className="pointer-events-none absolute inset-0">
          {points.map((point, index) => {
            if (point.hours === null) return null;
            const left = plotSize.width
              ? (point.x / 100) * plotSize.width
              : 0;
            const top = plotSize.height
              ? (point.y / height) * plotSize.height
              : 0;
            return (
              <div
                key={index}
                className={[
                  "absolute rounded-full bg-[#9d8bff] ring-1 ring-white/80",
                  index === activeIndex ? "h-3 w-3" : "h-1.5 w-1.5",
                ].join(" ")}
                style={{
                  left,
                  top,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          })}
        </div>
        </div>
        {activeIndex !== null && (() => {
          const point = getPoint(activeIndex);
          const tooltipTop = plotSize.height
            ? (point.y / height) * plotSize.height
            : 0;
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
                {point.date ? format(point.date, "M/d (EEE)") : "--"}
              </div>
              <div className="text-sm font-semibold">
                {point.hours !== null ? `${point.hours.toFixed(1)}h` : "No data"}
              </div>
            </div>
          );
        })()}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{firstDate ? format(firstDate, "M/d") : "-"}</span>
        <span>{lastDate ? format(lastDate, "M/d") : "-"}</span>
      </div>
    </div>
  );
}

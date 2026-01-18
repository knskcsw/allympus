"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EvmLineChart from "./EvmLineChart";
import type { ChartSeries, ProjectSeries, ViewMode } from "./types";
import { CHART_COLORS } from "./constants";
import { calculateCumulative, formatHours } from "./utils";

type EvmProjectCardProps = {
  project: ProjectSeries;
  days: string[];
  viewMode: ViewMode;
};

function EvmProjectCardComponent({
  project,
  days,
  viewMode,
}: EvmProjectCardProps) {
  const { chartSeries, referenceLines, valueFormatter } = useMemo(() => {
    const pvCumulative = calculateCumulative(project.pvSeries);
    const acCumulative = calculateCumulative(project.acSeries);
    const pvSeries =
      viewMode === "daily" ? project.pvSeries : pvCumulative;
    const acSeries =
      viewMode === "daily" ? project.acSeries : acCumulative;
    const acpvSeries = pvCumulative.map((pvValue, index) => {
      const acValue = acCumulative[index] ?? 0;
      return pvValue > 0 ? acValue / pvValue : 0;
    });

    const series: ChartSeries[] =
      viewMode === "acpv"
        ? [{ label: "CBI (AC/PV)", color: CHART_COLORS.acpv, data: acpvSeries }]
        : [
            { label: "PV", color: CHART_COLORS.pv, data: pvSeries },
            { label: "AC", color: CHART_COLORS.ac, data: acSeries },
          ];

    const refLines =
      viewMode === "acpv"
        ? [{ value: 1, color: "rgba(148,163,184,0.7)", dasharray: "4 4" }]
        : undefined;

    const formatter =
      viewMode === "acpv"
        ? (value: number) => `${value.toFixed(2)}x`
        : undefined;

    return {
      chartSeries: series,
      referenceLines: refLines,
      valueFormatter: formatter,
    };
  }, [project.pvSeries, project.acSeries, viewMode]);

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary))/12,_transparent_55%)]" />
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
          <span>{project.projectName}</span>
          <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            PV {formatHours(project.totals.pvHours)} / AC{" "}
            {formatHours(project.totals.acHours)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <EvmLineChart
          dates={days}
          series={chartSeries}
          valueFormatter={valueFormatter}
          referenceLines={referenceLines}
        />
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {chartSeries.map((series) => (
            <span key={series.label} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: series.color }}
              />
              {series.label}
            </span>
          ))}
          <span>
            Fixed {formatHours(project.totals.fixedHours)} / Est{" "}
            {formatHours(project.totals.estimatedHours)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export const EvmProjectCard = memo(EvmProjectCardComponent);

"use client";

import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EvmLineChart from "@/components/evm/EvmLineChart";
import { toCumulative } from "@/lib/utils";
import type {
  WorkTypeReportData,
  WorkTypeChartsData,
  RatioViewMode,
} from "@/types/reports";

/** Chart color constants */
const CHART_COLORS = {
  pv: "#3b82f6",
  ac: "#ef4444",
  bac: "#10b981",
  forecast: "#f59e0b",
} as const;

interface WorkTypeRatioChartsProps {
  workTypeReport: WorkTypeReportData | null;
  ratioViewMode: RatioViewMode;
  onViewModeChange: (mode: RatioViewMode) => void;
  isLoading: boolean;
}

interface ChartLegendProps {
  colors: typeof CHART_COLORS;
}

const ChartLegend = memo(function ChartLegend({ colors }: ChartLegendProps) {
  const items = [
    { color: colors.pv, label: "PV" },
    { color: colors.ac, label: "AC" },
    { color: colors.bac, label: "BAC" },
    { color: colors.forecast, label: "Forecast" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
});

interface ViewModeSwitcherProps {
  mode: RatioViewMode;
  onModeChange: (mode: RatioViewMode) => void;
}

const ViewModeSwitcher = memo(function ViewModeSwitcher({
  mode,
  onModeChange,
}: ViewModeSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={mode === "daily" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("daily")}
      >
        Daily
      </Button>
      <Button
        variant={mode === "cumulative" ? "default" : "outline"}
        size="sm"
        onClick={() => onModeChange("cumulative")}
      >
        Cumulative
      </Button>
    </div>
  );
});

function useWorkTypeCharts(
  workTypeReport: WorkTypeReportData | null,
  ratioViewMode: RatioViewMode
): WorkTypeChartsData | null {
  return useMemo(() => {
    if (!workTypeReport?.days || !workTypeReport?.types) return null;

    const { days, types } = workTypeReport;

    // Calculate totals across all work types
    const totalPvDaily = days.map((_, index) =>
      types.reduce((acc, type) => acc + (type.pvDaily[index] || 0), 0)
    );
    const totalAcDaily = days.map((_, index) =>
      types.reduce((acc, type) => acc + (type.acDaily[index] || 0), 0)
    );
    const totalBac = types.reduce((acc, type) => acc + type.bacTotal, 0);

    // Apply view mode transformation
    const totalsPv =
      ratioViewMode === "daily" ? totalPvDaily : toCumulative(totalPvDaily);
    const totalsAc =
      ratioViewMode === "daily" ? totalAcDaily : toCumulative(totalAcDaily);
    const cumulativeTotalsAc = toCumulative(totalAcDaily);

    return {
      days,
      types: types.map((type) => {
        const pvSeries =
          ratioViewMode === "daily" ? type.pvDaily : toCumulative(type.pvDaily);
        const acSeries =
          ratioViewMode === "daily" ? type.acDaily : toCumulative(type.acDaily);
        const cumulativeAc = toCumulative(type.acDaily);
        const bacRatio = totalBac ? (type.bacTotal / totalBac) * 100 : 0;

        // Calculate ratio series
        const pvRatio = pvSeries.map((value, index) =>
          totalsPv[index] ? (value / totalsPv[index]) * 100 : 0
        );
        const acRatio = acSeries.map((value, index) =>
          totalsAc[index] ? (value / totalsAc[index]) * 100 : 0
        );
        const bacSeries = days.map(() => bacRatio);

        // Calculate forecast series
        const forecastSeries = days.map((_, index) => {
          const elapsed = index + 1;
          const remaining = days.length - elapsed;
          const currentType = cumulativeAc[index] || 0;
          const currentTotal = cumulativeTotalsAc[index] || 0;
          const typeForecast =
            currentType === 0
              ? 0
              : currentType + (currentType / elapsed) * remaining;
          const totalForecast =
            currentTotal === 0
              ? 0
              : currentTotal + (currentTotal / elapsed) * remaining;
          return totalForecast ? (typeForecast / totalForecast) * 100 : 0;
        });

        return {
          label: type.label,
          pvRatio,
          acRatio,
          bacSeries,
          forecastSeries,
        };
      }),
    };
  }, [workTypeReport, ratioViewMode]);
}

export const WorkTypeRatioCharts = memo(function WorkTypeRatioCharts({
  workTypeReport,
  ratioViewMode,
  onViewModeChange,
  isLoading,
}: WorkTypeRatioChartsProps) {
  const chartData = useWorkTypeCharts(workTypeReport, ratioViewMode);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Work Type Ratio Trends</CardTitle>
          <p className="text-sm text-muted-foreground">
            PV/AC ratio trends with BAC/forecast baselines
          </p>
        </div>
        <ViewModeSwitcher mode={ratioViewMode} onModeChange={onViewModeChange} />
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading || !chartData ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading work type ratios...
          </div>
        ) : (
          <div className="space-y-6">
            <ChartLegend colors={CHART_COLORS} />
            <div className="grid gap-6 lg:grid-cols-3">
              {chartData.types.map((type) => (
                <Card key={type.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{type.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EvmLineChart
                      dates={chartData.days}
                      maxValue={100}
                      valueFormatter={formatPercentage}
                      series={[
                        { label: "PV", color: CHART_COLORS.pv, data: type.pvRatio },
                        { label: "AC", color: CHART_COLORS.ac, data: type.acRatio },
                        { label: "BAC", color: CHART_COLORS.bac, data: type.bacSeries },
                        { label: "Forecast", color: CHART_COLORS.forecast, data: type.forecastSeries },
                      ]}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

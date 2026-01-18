"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WorkTypeBarChart from "@/components/charts/WorkTypeBarChart";
import { useMonthlyWorkTypeRatio } from "@/hooks/useMonthlyWorkTypeRatio";
import { LoadingPlaceholder } from "./LoadingPlaceholder";

const CHART_COLORS = {
  pv: "#3b82f6",
  bac: "#10b981",
  ac: "#ef4444",
  forecast: "#f59e0b",
} as const;

interface MonthlyWorkTypeRatioCardProps {
  year: number;
  month: number;
}

export function MonthlyWorkTypeRatioCard({
  year,
  month,
}: MonthlyWorkTypeRatioCardProps) {
  const { types, isLoading } = useMonthlyWorkTypeRatio(year, month);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Type Ratio</CardTitle>
        <p className="text-sm text-muted-foreground">
          Current distribution by work type
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingPlaceholder height="h-64" message="Loading work type ratios..." />
        ) : types.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No work type data available for this period
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {types.map((type) => (
              <Card key={type.workType}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{type.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkTypeBarChart
                    data={[
                      { category: "PV", value: type.pvRatio },
                      { category: "BAC", value: type.bacRatio },
                      { category: "AC", value: type.acRatio },
                      { category: "Forecast", value: type.forecastRatio },
                    ]}
                    workTypeLabel={type.label}
                    colors={CHART_COLORS}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { addMonths, format, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EvmLineChart from "@/components/evm/EvmLineChart";

type ProjectSeries = {
  projectId: string;
  projectName: string;
  acSeries: number[];
  pvSeries: number[];
  totals: {
    acHours: number;
    pvHours: number;
    fixedHours: number;
    estimatedHours: number;
  };
};

type EvmData = {
  period: { start: string; end: string };
  days: string[];
  projects: ProjectSeries[];
};

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export default function EvmPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<EvmData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"daily" | "cumulative">("daily");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch(`/api/evm?year=${year}&month=${month}`);
    const result = await response.json();
    setData(result);
    setIsLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">EVM</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border bg-background p-1 shadow-sm">
            <Button
              variant={viewMode === "daily" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("daily")}
              className="rounded-full"
            >
              日別
            </Button>
            <Button
              variant={viewMode === "cumulative" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cumulative")}
              className="rounded-full"
            >
              積算
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[120px] text-center">
              {format(currentDate, "yyyy年 M月", { locale: ja })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {data.projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects for this period
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.projects.map((project) => {
            const cumulative = (values: number[]) => {
              let sum = 0;
              return values.map((value) => {
                sum += value;
                return sum;
              });
            };
            const pvSeries = viewMode === "daily" ? project.pvSeries : cumulative(project.pvSeries);
            const acSeries = viewMode === "daily" ? project.acSeries : cumulative(project.acSeries);

            return (
              <Card key={project.projectId} className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary))/12,_transparent_55%)]" />
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
                    <span>{project.projectName}</span>
                    <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                      PV {formatHours(project.totals.pvHours)} / AC {formatHours(project.totals.acHours)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <EvmLineChart
                    dates={data.days}
                    series={[
                      {
                        label: "PV",
                        color: "hsl(var(--chart-2))",
                        data: pvSeries,
                      },
                      {
                        label: "AC",
                        color: "hsl(var(--chart-1))",
                        data: acSeries,
                      },
                    ]}
                  />
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-2))" }} />
                      PV
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(var(--chart-1))" }} />
                      AC
                    </span>
                    <span>
                      Fixed {formatHours(project.totals.fixedHours)} / Est {formatHours(project.totals.estimatedHours)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

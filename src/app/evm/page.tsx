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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">EVM</h1>
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

      {data.projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No projects for this period
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {data.projects.map((project) => (
            <Card key={project.projectId}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{project.projectName}</span>
                  <span className="text-xs text-muted-foreground">
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
                      data: project.pvSeries,
                    },
                    {
                      label: "AC",
                      color: "hsl(var(--chart-1))",
                      data: project.acSeries,
                    },
                  ]}
                />
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
          ))}
        </div>
      )}
    </div>
  );
}

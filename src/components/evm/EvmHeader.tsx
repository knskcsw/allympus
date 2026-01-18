"use client";

import { memo } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, LineChart } from "lucide-react";
import type { ViewMode } from "./types";

type EvmHeaderProps = {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function EvmHeaderComponent({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrevMonth,
  onNextMonth,
}: EvmHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <LineChart className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold">EVM</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border bg-background p-1 shadow-sm">
          <Button
            variant={viewMode === "cumulative" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("cumulative")}
            className="rounded-full"
          >
            積算
          </Button>
          <Button
            variant={viewMode === "daily" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("daily")}
            className="rounded-full"
          >
            日別
          </Button>
          <Button
            variant={viewMode === "acpv" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => onViewModeChange("acpv")}
            className="rounded-full"
          >
            CBI
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[120px] text-center">
            {format(currentDate, "yyyy年 M月", { locale: ja })}
          </span>
          <Button variant="outline" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export const EvmHeader = memo(EvmHeaderComponent);

"use client";

import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SalaryLineChart from "@/components/salary/SalaryLineChart";
import { SalarySummaryCards } from "@/components/salary/SalarySummaryCards";
import { SalaryDeductionChart } from "@/components/salary/SalaryDeductionChart";
import { SalaryTable } from "@/components/salary/SalaryTable";
import { useSalaryData } from "@/hooks/useSalaryData";
import { formatCurrency } from "@/lib/salary-utils";

function PageHeader({
  year,
  onPrevYear,
  onNextYear,
  onAddMonth,
}: {
  year: number;
  onPrevYear: () => void;
  onNextYear: () => void;
  onAddMonth: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Salary</h1>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevYear}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-lg font-medium min-w-[110px] text-center">
          {year}年
        </span>
        <Button variant="outline" size="icon" onClick={onNextYear}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button onClick={onAddMonth}>月を追加</Button>
      </div>
    </div>
  );
}

function NetTrendChart({
  netTrend,
  maxNet,
  latestNet,
}: {
  netTrend: Array<{ month: number; net: number }>;
  maxNet: number;
  latestNet: number;
}) {
  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>手取りの推移</CardTitle>
      </CardHeader>
      <CardContent>
        <SalaryLineChart
          data={netTrend.map((item) => ({
            month: item.month,
            value: item.net,
          }))}
          formatValue={formatCurrency}
          label="手取り"
        />
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>最大: {formatCurrency(maxNet)}</span>
          <span>最新: {formatCurrency(latestNet)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">Loading...</div>
  );
}

export default function SalaryPage() {
  const {
    year,
    sortedRows,
    isLoading,
    savingRows,
    totals,
    deductionTotals,
    netTrend,
    maxNet,
    handlePrevYear,
    handleNextYear,
    handleValueChange,
    handleSaveRow,
    handleAddMonth,
    handleRemoveMonth,
  } = useSalaryData();

  if (isLoading) {
    return <LoadingState />;
  }

  const latestNet = sortedRows.at(-1)?.net ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        year={year}
        onPrevYear={handlePrevYear}
        onNextYear={handleNextYear}
        onAddMonth={handleAddMonth}
      />

      <SalarySummaryCards totals={totals} />

      <div className="grid gap-6 lg:grid-cols-5">
        <NetTrendChart
          netTrend={netTrend}
          maxNet={maxNet}
          latestNet={latestNet}
        />

        <SalaryDeductionChart
          deductionTotals={deductionTotals}
          totalDeductions={totals.deductions}
        />
      </div>

      <SalaryTable
        rows={sortedRows}
        savingRows={savingRows}
        onValueChange={handleValueChange}
        onSaveRow={handleSaveRow}
        onRemoveMonth={handleRemoveMonth}
      />
    </div>
  );
}

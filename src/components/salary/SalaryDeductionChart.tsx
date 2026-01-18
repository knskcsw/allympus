"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeductionTotal } from "@/types/salary";
import { formatCurrency } from "@/lib/salary-utils";

type DeductionBarProps = {
  label: string;
  value: number;
  ratio: number;
  color: string;
};

const DeductionBar = memo(function DeductionBar({
  label,
  value,
  ratio,
  color,
}: DeductionBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{formatCurrency(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
});

type SalaryDeductionChartProps = {
  deductionTotals: DeductionTotal[];
  totalDeductions: number;
};

export const SalaryDeductionChart = memo(function SalaryDeductionChart({
  deductionTotals,
  totalDeductions,
}: SalaryDeductionChartProps) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>控除の内訳</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {deductionTotals.map((item) => {
          const ratio = totalDeductions
            ? (item.value / totalDeductions) * 100
            : 0;
          return (
            <DeductionBar
              key={item.key}
              label={item.label}
              value={item.value}
              ratio={ratio}
              color={item.color}
            />
          );
        })}
      </CardContent>
    </Card>
  );
});

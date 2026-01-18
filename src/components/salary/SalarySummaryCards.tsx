"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalaryTotals } from "@/types/salary";
import { formatCurrency } from "@/lib/salary-utils";

type SummaryCardProps = {
  title: string;
  value: number;
  description: string;
};

const SummaryCard = memo(function SummaryCard({
  title,
  value,
  description,
}: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formatCurrency(value)}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
});

type SalarySummaryCardsProps = {
  totals: SalaryTotals;
};

export const SalarySummaryCards = memo(function SalarySummaryCards({
  totals,
}: SalarySummaryCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="年間の額面"
        value={totals.gross}
        description="基本給 + 賞与"
      />
      <SummaryCard
        title="年間の手取り"
        value={totals.net}
        description="手取り合計"
      />
      <SummaryCard
        title="控除合計"
        value={totals.deductions}
        description="税金 + 保険料"
      />
      <SummaryCard
        title="平均手取り"
        value={totals.averageNet}
        description="記録月ベース"
      />
    </div>
  );
});

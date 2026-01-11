"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SalaryLineChart from "@/components/salary/SalaryLineChart";

type SalaryEntry = {
  id: string;
  year: number;
  month: number;
  gross: number;
  net: number;
  healthInsurance: number;
  pension: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  otherDeductions: number;
  bonus: number;
};

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const deductionLabels: Array<{
  key: keyof SalaryEntry;
  label: string;
  color: string;
}> = [
  { key: "healthInsurance", label: "健康保険料", color: "bg-[var(--chart-1)]" },
  { key: "pension", label: "厚生年金", color: "bg-[var(--chart-2)]" },
  { key: "employmentInsurance", label: "雇用保険料", color: "bg-[var(--chart-3)]" },
  { key: "incomeTax", label: "所得税", color: "bg-[var(--chart-4)]" },
  { key: "residentTax", label: "住民税", color: "bg-[var(--chart-5)]" },
  { key: "otherDeductions", label: "その他控除", color: "bg-muted-foreground" },
];

const formatCurrency = (value: number) => currencyFormatter.format(Math.round(value));

const sumBy = (items: SalaryEntry[], key: keyof SalaryEntry) =>
  items.reduce((total, item) => total + item[key], 0);

const getTotalDeductions = (row: SalaryEntry) =>
  row.healthInsurance +
  row.pension +
  row.employmentInsurance +
  row.incomeTax +
  row.residentTax +
  row.otherDeductions;

export default function SalaryPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<SalaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.month - b.month),
    [rows]
  );

  const fetchRows = useCallback(async (targetYear: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/salary?year=${targetYear}`);
      if (!response.ok) {
        throw new Error("Failed to load salary records");
      }
      const data = (await response.json()) as SalaryEntry[];
      setRows(data);
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows(year);
  }, [fetchRows, year]);

  const handlePrevYear = () => {
    setYear((prev) => prev - 1);
  };

  const handleNextYear = () => {
    setYear((prev) => prev + 1);
  };

  const handleValueChange = (
    id: string,
    key: keyof SalaryEntry,
    value: string
  ) => {
    const numericValue = Number(value.replace(/,/g, ""));
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [key]: Number.isNaN(numericValue) ? 0 : numericValue } : row
      )
    );
  };

  const handleSaveRow = useCallback(async (row: SalaryEntry) => {
    setSavingRows((prev) => ({ ...prev, [row.id]: true }));
    try {
      const response = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row),
      });
      if (!response.ok) {
        throw new Error("Failed to save salary record");
      }
      const saved = (await response.json()) as SalaryEntry;
      setRows((current) =>
        current.map((item) => (item.id === saved.id ? saved : item))
      );
    } catch (error) {
      console.error(error);
      alert("保存に失敗しました。もう一度お試しください。");
    } finally {
      setSavingRows((prev) => ({ ...prev, [row.id]: false }));
    }
  }, []);

  const handleAddMonth = async () => {
    const months = rows.map((row) => row.month);
    const nextMonth = months.length ? Math.max(...months) + 1 : 1;
    if (nextMonth > 12) {
      alert("12ヶ月以上は追加できません。");
      return;
    }
    try {
      const response = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month: nextMonth,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to add salary record");
      }
      const saved = (await response.json()) as SalaryEntry;
      setRows((current) => [...current, saved]);
    } catch (error) {
      console.error(error);
      alert("追加に失敗しました。");
    }
  };

  const handleRemoveMonth = async (row: SalaryEntry) => {
    try {
      const response = await fetch("/api/salary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: row.year, month: row.month }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete salary record");
      }
      setRows((current) => current.filter((item) => item.id !== row.id));
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました。");
    }
  };

  const totals = useMemo(() => {
    const gross = sumBy(rows, "gross");
    const net = sumBy(rows, "net");
    const bonus = sumBy(rows, "bonus");
    const deductions = rows.reduce((total, row) => total + getTotalDeductions(row), 0);
    const averageNet = rows.length ? net / rows.length : 0;
    return { gross, net, bonus, deductions, averageNet };
  }, [rows]);

  const deductionTotals = useMemo(
    () =>
      deductionLabels.map((item) => ({
        ...item,
        value: sumBy(rows, item.key),
      })),
    [rows]
  );

  const netTrend = useMemo(() => {
    const byMonth = new Map(sortedRows.map((row) => [row.month, row.net]));
    return Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      net: byMonth.get(index + 1) ?? 0,
    }));
  }, [sortedRows]);

  const maxNet = Math.max(1, ...netTrend.map((item) => item.net));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
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
          <Button variant="outline" size="icon" onClick={handlePrevYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[110px] text-center">
            {year}年
          </span>
          <Button variant="outline" size="icon" onClick={handleNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddMonth}>月を追加</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              年間の額面
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totals.gross)}</div>
            <p className="text-xs text-muted-foreground">基本給 + 賞与</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              年間の手取り
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totals.net)}</div>
            <p className="text-xs text-muted-foreground">手取り合計</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              控除合計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totals.deductions)}</div>
            <p className="text-xs text-muted-foreground">税金 + 保険料</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均手取り
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(totals.averageNet)}
            </div>
            <p className="text-xs text-muted-foreground">記録月ベース</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
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
              <span>最新: {formatCurrency(sortedRows.at(-1)?.net ?? 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>控除の内訳</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deductionTotals.map((item) => {
              const ratio = totals.deductions
                ? (item.value / totals.deductions) * 100
                : 0;
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>月次レコード</CardTitle>
          <span className="text-xs text-muted-foreground">
            セルを編集すると自動で保存されます
          </span>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>月</TableHead>
                <TableHead className="text-right">額面</TableHead>
                <TableHead className="text-right">手取り</TableHead>
                <TableHead className="text-right">健康保険</TableHead>
                <TableHead className="text-right">厚生年金</TableHead>
                <TableHead className="text-right">雇用保険</TableHead>
                <TableHead className="text-right">所得税</TableHead>
                <TableHead className="text-right">住民税</TableHead>
                <TableHead className="text-right">その他</TableHead>
                <TableHead className="text-right">賞与</TableHead>
                <TableHead className="text-right">控除合計</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.month}月</TableCell>
                  {(
                    [
                      "gross",
                      "net",
                      "healthInsurance",
                      "pension",
                      "employmentInsurance",
                      "incomeTax",
                      "residentTax",
                      "otherDeductions",
                      "bonus",
                    ] as Array<keyof SalaryEntry>
                  ).map((key) => (
                    <TableCell key={`${row.id}-${key}`} className="text-right">
                      <Input
                        type="number"
                        value={row[key]}
                        onChange={(event) =>
                          handleValueChange(row.id, key, event.target.value)
                        }
                        onBlur={() => handleSaveRow(row)}
                        className="h-8 text-right"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    {formatCurrency(getTotalDeductions(row))}
                  </TableCell>
                  <TableCell className="text-right">
                    {savingRows[row.id] ? (
                      <span className="text-xs text-muted-foreground">保存中...</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMonth(row)}
                        disabled={sortedRows.length <= 1}
                      >
                        削除
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {sortedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    まだ記録がありません。月を追加してください。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

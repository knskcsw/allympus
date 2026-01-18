"use client";

import { memo, useCallback } from "react";
import { Trash2 } from "lucide-react";
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
import type { SalaryEntry, EditableSalaryKey } from "@/types/salary";
import {
  formatCurrency,
  getTotalDeductions,
  EDITABLE_SALARY_KEYS,
  SALARY_TABLE_HEADERS,
} from "@/lib/salary-utils";

type SalaryInputCellProps = {
  rowId: string;
  fieldKey: EditableSalaryKey;
  value: number;
  onValueChange: (id: string, key: keyof SalaryEntry, value: string) => void;
  onBlur: () => void;
};

const SalaryInputCell = memo(function SalaryInputCell({
  rowId,
  fieldKey,
  value,
  onValueChange,
  onBlur,
}: SalaryInputCellProps) {
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(rowId, fieldKey, event.target.value);
    },
    [rowId, fieldKey, onValueChange]
  );

  return (
    <TableCell className="text-right">
      <Input
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        className="h-8 text-right"
      />
    </TableCell>
  );
});

type SalaryTableRowProps = {
  row: SalaryEntry;
  isSaving: boolean;
  canDelete: boolean;
  onValueChange: (id: string, key: keyof SalaryEntry, value: string) => void;
  onSaveRow: (row: SalaryEntry) => void;
  onRemoveMonth: (row: SalaryEntry) => void;
};

const SalaryTableRow = memo(function SalaryTableRow({
  row,
  isSaving,
  canDelete,
  onValueChange,
  onSaveRow,
  onRemoveMonth,
}: SalaryTableRowProps) {
  const handleBlur = useCallback(() => {
    onSaveRow(row);
  }, [onSaveRow, row]);

  const handleRemove = useCallback(() => {
    onRemoveMonth(row);
  }, [onRemoveMonth, row]);

  return (
    <TableRow>
      <TableCell>{row.month}月</TableCell>
      {EDITABLE_SALARY_KEYS.map((key) => (
        <SalaryInputCell
          key={`${row.id}-${key}`}
          rowId={row.id}
          fieldKey={key}
          value={row[key]}
          onValueChange={onValueChange}
          onBlur={handleBlur}
        />
      ))}
      <TableCell className="text-right">
        {formatCurrency(getTotalDeductions(row))}
      </TableCell>
      <TableCell className="text-right">
        {isSaving ? (
          <span className="text-xs text-muted-foreground">保存中...</span>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleRemove}
            disabled={!canDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
});

type SalaryTableProps = {
  rows: SalaryEntry[];
  savingRows: Record<string, boolean>;
  onValueChange: (id: string, key: keyof SalaryEntry, value: string) => void;
  onSaveRow: (row: SalaryEntry) => Promise<void>;
  onRemoveMonth: (row: SalaryEntry) => Promise<void>;
};

export const SalaryTable = memo(function SalaryTable({
  rows,
  savingRows,
  onValueChange,
  onSaveRow,
  onRemoveMonth,
}: SalaryTableProps) {
  const canDelete = rows.length > 1;

  return (
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
              {SALARY_TABLE_HEADERS.map(({ key, label }) => (
                <TableHead key={key} className="text-right">
                  {label}
                </TableHead>
              ))}
              <TableHead className="text-right">控除合計</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <SalaryTableRow
                key={row.id}
                row={row}
                isSaving={savingRows[row.id] ?? false}
                canDelete={canDelete}
                onValueChange={onValueChange}
                onSaveRow={onSaveRow}
                onRemoveMonth={onRemoveMonth}
              />
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="text-center text-muted-foreground"
                >
                  まだ記録がありません。月を追加してください。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
});

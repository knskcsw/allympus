"use client";

import { Fragment, memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { EditableCell } from "./EditableCell";
import {
  type VacationData,
  type WorkingDaysData,
  type EditableField,
  MONTHS,
  MONTH_NAMES,
  DEFAULT_WORKING_DAYS,
  calculateStandardHours,
} from "./types";

// Vacation Row
interface VacationRowProps {
  vacationData: VacationData;
  onVacationChange: (month: number, value: number) => void;
  calculateVacationTotal: () => number;
}

export const VacationRow = memo(function VacationRow({
  vacationData,
  onVacationChange,
  calculateVacationTotal,
}: VacationRowProps) {
  return (
    <TableRow className="bg-blue-50 dark:bg-blue-950">
      <TableCell className="sticky left-0 bg-blue-50 dark:bg-blue-950 font-medium z-10 border border-muted-foreground/20 px-1 py-0.5 text-sm">
        休暇
      </TableCell>
      {MONTHS.map((month, index) => (
        <Fragment key={`vacation-${month}`}>
          <TableCell className="text-center text-xs text-muted-foreground border border-muted-foreground/20 px-1 py-0.5">
            -
          </TableCell>
          <TableCell className="bg-blue-50 dark:bg-blue-950 border border-muted-foreground/20 px-1 py-0.5 text-sm">
            <EditableCell
              value={vacationData[month]?.hours || 0}
              onCommit={(value) => onVacationChange(month, value)}
              ariaLabel={`${MONTH_NAMES[index]} 休暇`}
            />
          </TableCell>
        </Fragment>
      ))}
      <TableCell className="text-center text-muted-foreground bg-blue-100 dark:bg-blue-900 border border-muted-foreground/20 px-1 py-0.5 text-xs">
        -
      </TableCell>
      <TableCell className="text-right font-medium bg-blue-100 dark:bg-blue-900 border border-muted-foreground/20 px-1 py-0.5 text-sm">
        {calculateVacationTotal().toFixed(1)}h
      </TableCell>
    </TableRow>
  );
});

// Month Total Row
interface MonthTotalRowProps {
  calculateMonthTotal: (month: number, field: EditableField) => number;
  calculateGrandTotal: (field: EditableField) => number;
}

export const MonthTotalRow = memo(function MonthTotalRow({
  calculateMonthTotal,
  calculateGrandTotal,
}: MonthTotalRowProps) {
  return (
    <TableRow className="bg-green-50 dark:bg-green-950 font-bold">
      <TableCell className="sticky left-0 bg-green-50 dark:bg-green-950 z-10 border border-muted-foreground/20 px-1 py-0.5 text-sm">
        月別合計
      </TableCell>
      {MONTHS.map((month) => (
        <Fragment key={`month-total-${month}`}>
          <TableCell className="text-right border border-muted-foreground/20 px-1 py-0.5 text-sm">
            {calculateMonthTotal(month, "estimatedHours").toFixed(1)}h
          </TableCell>
          <TableCell className="text-right border border-muted-foreground/20 px-1 py-0.5 text-sm">
            {calculateMonthTotal(month, "actualHours").toFixed(1)}h
          </TableCell>
        </Fragment>
      ))}
      <TableCell className="text-right bg-green-100 dark:bg-green-900 border border-muted-foreground/20 px-1 py-0.5 text-sm">
        {calculateGrandTotal("estimatedHours").toFixed(1)}h
      </TableCell>
      <TableCell className="text-right bg-green-100 dark:bg-green-900 border border-muted-foreground/20 px-1 py-0.5 text-sm">
        {calculateGrandTotal("actualHours").toFixed(1)}h
      </TableCell>
    </TableRow>
  );
});

// Overtime Row
interface OvertimeRowProps {
  calculateOvertimeHours: (month: number) => number;
  calculateYearOvertimeHours: () => number;
}

export const OvertimeRow = memo(function OvertimeRow({
  calculateOvertimeHours,
  calculateYearOvertimeHours,
}: OvertimeRowProps) {
  return (
    <TableRow className="bg-orange-50 dark:bg-orange-950 font-bold">
      <TableCell className="sticky left-0 bg-orange-50 dark:bg-orange-950 z-10 border border-muted-foreground/20 px-1 py-0.5 text-sm">
        残業時間
      </TableCell>
      {MONTHS.map((month) => {
        const overtime = calculateOvertimeHours(month);
        return (
          <TableCell
            key={`${month}-overtime`}
            colSpan={2}
            className={`text-center ${
              overtime > 0
                ? "text-orange-600 dark:text-orange-400"
                : "text-muted-foreground"
            } border border-muted-foreground/20 px-1 py-0.5 text-sm`}
          >
            {overtime.toFixed(1)}h
          </TableCell>
        );
      })}
      <TableCell
        colSpan={2}
        className="text-center bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 border border-muted-foreground/20 px-1 py-0.5 text-sm"
      >
        {calculateYearOvertimeHours().toFixed(1)}h
      </TableCell>
    </TableRow>
  );
});

// Standard Hours Row
interface StandardHoursRowProps {
  workingDaysData: WorkingDaysData;
  calculateYearStandardHours: () => number;
}

export const StandardHoursRow = memo(function StandardHoursRow({
  workingDaysData,
  calculateYearStandardHours,
}: StandardHoursRowProps) {
  return (
    <TableRow className="bg-muted">
      <TableCell className="sticky left-0 bg-muted font-bold text-sm z-10 border border-muted-foreground/20 px-1 py-0.5">
        標準時間
      </TableCell>
      {MONTHS.map((month) => {
        const workingDays = workingDaysData[month] || DEFAULT_WORKING_DAYS[month] || 20;
        const standardHours = calculateStandardHours(workingDays);
        return (
          <TableCell
            key={`${month}-std`}
            colSpan={2}
            className="text-center text-xs border border-muted-foreground/20 px-1 py-0.5"
          >
            {standardHours.toFixed(1)}h ({workingDays}日)
          </TableCell>
        );
      })}
      <TableCell
        colSpan={2}
        className="text-center text-xs bg-muted border border-muted-foreground/20 px-1 py-0.5"
      >
        {calculateYearStandardHours().toFixed(1)}h
      </TableCell>
    </TableRow>
  );
});

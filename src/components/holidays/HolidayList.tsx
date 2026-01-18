"use client";

import { memo, useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Holiday } from "@/generated/prisma/client";
import {
  HOLIDAY_TYPE_LABELS,
  HOLIDAY_TYPE_BADGE_COLORS,
  type HolidayType,
} from "@/lib/holidays";

interface HolidayListProps {
  holidays: Holiday[];
  onDelete: (id: string) => void;
}

const ALL_HOLIDAY_TYPES: HolidayType[] = [
  "PUBLIC_HOLIDAY",
  "WEEKEND",
  "SPECIAL_HOLIDAY",
  "PAID_LEAVE",
];

interface HolidayTypeBadgeProps {
  type: HolidayType;
}

const HolidayTypeBadge = memo(function HolidayTypeBadge({
  type,
}: HolidayTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        HOLIDAY_TYPE_BADGE_COLORS[type] ||
          "bg-gray-100 text-gray-800 border-gray-300"
      )}
    >
      {HOLIDAY_TYPE_LABELS[type] || type}
    </span>
  );
});

interface HolidayRowProps {
  holiday: Holiday;
  onDelete: (id: string) => void;
}

const HolidayRow = memo(function HolidayRow({
  holiday,
  onDelete,
}: HolidayRowProps) {
  const formattedDate = useMemo(
    () =>
      format(new Date(holiday.date), "yyyy年M月d日(E)", {
        locale: ja,
      }),
    [holiday.date]
  );

  const handleDelete = useCallback(() => {
    onDelete(holiday.id);
  }, [onDelete, holiday.id]);

  return (
    <TableRow>
      <TableCell>{formattedDate}</TableCell>
      <TableCell>{holiday.name}</TableCell>
      <TableCell>
        <HolidayTypeBadge type={holiday.type as HolidayType} />
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
});

interface TypeFilterProps {
  selectedTypes: HolidayType[];
  onToggleType: (type: HolidayType) => void;
}

const TypeFilter = memo(function TypeFilter({
  selectedTypes,
  onToggleType,
}: TypeFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          表示フィルター
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>表示する休日の種類</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_HOLIDAY_TYPES.map((type) => (
          <DropdownMenuCheckboxItem
            key={type}
            checked={selectedTypes.includes(type)}
            onCheckedChange={() => onToggleType(type)}
          >
            {HOLIDAY_TYPE_LABELS[type]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export const HolidayList = memo(function HolidayList({
  holidays,
  onDelete,
}: HolidayListProps) {
  const [selectedTypes, setSelectedTypes] =
    useState<HolidayType[]>(ALL_HOLIDAY_TYPES);

  const toggleType = useCallback((type: HolidayType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const filteredHolidays = useMemo(
    () => holidays.filter((holiday) => selectedTypes.includes(holiday.type as HolidayType)),
    [holidays, selectedTypes]
  );

  const emptyMessage = useMemo(() => {
    if (holidays.length === 0) {
      return "登録された休日はありません";
    }
    return "選択された種類の休日はありません";
  }, [holidays.length]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>休日一覧</CardTitle>
          <TypeFilter selectedTypes={selectedTypes} onToggleType={toggleType} />
        </div>
      </CardHeader>
      <CardContent>
        {filteredHolidays.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日付</TableHead>
                <TableHead>休日名</TableHead>
                <TableHead>種類</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHolidays.map((holiday) => (
                <HolidayRow
                  key={holiday.id}
                  holiday={holiday}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
});

"use client";

import { Fragment, memo, type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { EditableCell } from "./EditableCell";
import {
  type Project,
  type WorkHoursData,
  type EditableField,
  MONTHS,
  MONTH_NAMES,
} from "./types";

const CELL_CLASS = "border border-muted-foreground/20 px-1 py-0.5 text-sm";

interface SortableProjectRowProps {
  project: Project;
  projectIndex: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  workHoursData: WorkHoursData;
  onCellChange: (
    projectId: string,
    month: number,
    field: EditableField,
    value: number
  ) => void;
  onCellPaste: (
    event: React.ClipboardEvent<HTMLDivElement>,
    projectIndex: number,
    monthIndex: number,
    field: EditableField
  ) => void;
  onMoveProject: (projectId: string, direction: "up" | "down") => void;
  calculateYearTotal: (projectId: string, field: EditableField) => number;
}

export const SortableProjectRow = memo(function SortableProjectRow({
  project,
  projectIndex,
  canMoveUp,
  canMoveDown,
  workHoursData,
  onCellChange,
  onCellPaste,
  onMoveProject,
  calculateYearTotal,
}: SortableProjectRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-70" : undefined}
    >
      <TableCell className="sticky left-0 bg-background font-medium z-10 border border-muted-foreground/20 px-1 py-0.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">{project.name}</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMoveProject(project.id, "up")}
              disabled={!canMoveUp}
              aria-label="Move up"
            >
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onMoveProject(project.id, "down")}
              disabled={!canMoveDown}
              aria-label="Move down"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </TableCell>

      {MONTHS.map((month, monthIndex) => (
        <Fragment key={`${project.id}-${month}`}>
          <TableCell className={CELL_CLASS}>
            <EditableCell
              value={workHoursData[project.id]?.[month]?.estimatedHours || 0}
              onCommit={(value) =>
                onCellChange(project.id, month, "estimatedHours", value)
              }
              onPaste={(event) =>
                onCellPaste(event, projectIndex, monthIndex, "estimatedHours")
              }
              ariaLabel={`${project.code} ${MONTH_NAMES[monthIndex]} 予測`}
            />
          </TableCell>
          <TableCell className={CELL_CLASS}>
            <EditableCell
              value={workHoursData[project.id]?.[month]?.actualHours || 0}
              onCommit={(value) =>
                onCellChange(project.id, month, "actualHours", value)
              }
              onPaste={(event) =>
                onCellPaste(event, projectIndex, monthIndex, "actualHours")
              }
              ariaLabel={`${project.code} ${MONTH_NAMES[monthIndex]} 実績`}
            />
          </TableCell>
        </Fragment>
      ))}

      {/* Year total columns */}
      <TableCell className="text-right font-medium bg-muted border border-muted-foreground/20 px-1 py-0.5 text-sm">
        {calculateYearTotal(project.id, "estimatedHours").toFixed(1)}h
      </TableCell>
      <TableCell className="text-right font-medium bg-muted border border-muted-foreground/20 px-1 py-0.5 text-sm">
        {calculateYearTotal(project.id, "actualHours").toFixed(1)}h
      </TableCell>
    </TableRow>
  );
});

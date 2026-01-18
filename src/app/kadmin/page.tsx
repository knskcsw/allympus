"use client";

import { Fragment, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Save, Calculator } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  type EditableField,
  MONTHS,
  MONTH_NAMES,
  DEFAULT_WORKING_DAYS,
  parseNumber,
  isLikelyNumber,
  getGroupKey,
} from "@/components/kadmin";
import { SortableProjectRow } from "@/components/kadmin/SortableProjectRow";
import {
  VacationRow,
  MonthTotalRow,
  OvertimeRow,
  StandardHoursRow,
} from "@/components/kadmin/SummaryRows";
import { useKadminData } from "@/hooks/useKadminData";
import { useKadminCalculations } from "@/hooks/useKadminCalculations";
import { useToast } from "@/hooks/useToast";

export default function KadminPage() {
  const { message: toastMessage, showToast } = useToast();

  const {
    projects,
    workHoursData,
    vacationData,
    workingDaysData,
    loading,
    saving,
    calculating,
    setProjects,
    setWorkHoursData,
    fetchAllData,
    handleCellChange,
    handleVacationChange,
    handleCalculateActual,
    handleSave,
    updateProjectOrder,
  } = useKadminData(
    () => showToast("実績時間を計算しました"),
    () => showToast("実績時間の計算に失敗しました")
  );

  const calculations = useKadminCalculations(
    projects,
    workHoursData,
    vacationData,
    workingDaysData
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Project movement handlers
  const handleMoveProject = useCallback(
    (projectId: string, direction: "up" | "down") => {
      setProjects((prev) => {
        const next = [...prev];
        const currentIndex = next.findIndex((p) => p.id === projectId);
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= next.length) {
          return prev;
        }
        if (getGroupKey(next[currentIndex]) !== getGroupKey(next[targetIndex])) {
          return prev;
        }

        [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
        void updateProjectOrder(next.map((p) => p.id));
        return next;
      });
    },
    [setProjects, updateProjectOrder]
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;

      setProjects((prev) => {
        const fromIndex = prev.findIndex((p) => p.id === active.id);
        const toIndex = prev.findIndex((p) => p.id === over.id);

        if (fromIndex < 0 || toIndex < 0) return prev;
        if (getGroupKey(prev[fromIndex]) !== getGroupKey(prev[toIndex])) return prev;

        const next = arrayMove(prev, fromIndex, toIndex);
        void updateProjectOrder(next.map((p) => p.id));
        return next;
      });
    },
    [setProjects, updateProjectOrder]
  );

  // Paste handling utilities
  const normalizePasteRows = useCallback((pasteData: string) => {
    return pasteData
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .map((row) => row.split("\t").map((cell) => cell.trim()))
      .filter((cells) => cells.some((cell) => cell.length > 0));
  }, []);

  const applyPasteData = useCallback(
    (startProjectIndex: number, startColumnIndex: number, pasteData: string) => {
      const rows = normalizePasteRows(pasteData);
      if (rows.length === 0) return;

      setWorkHoursData((prev) => {
        const updated = { ...prev };

        for (let rowOffset = 0; rowOffset < rows.length; rowOffset++) {
          const project = projects[startProjectIndex + rowOffset];
          if (!project) break;

          let cells = rows[rowOffset];
          if (cells.length >= MONTHS.length * 2 + 1 && !isLikelyNumber(cells[0])) {
            cells = cells.slice(1);
          }

          if (!cells.some((cell) => isLikelyNumber(cell))) {
            continue;
          }

          const projectData = updated[project.id] ? { ...updated[project.id] } : {};

          for (let colOffset = 0; colOffset < cells.length; colOffset++) {
            const columnIndex = startColumnIndex + colOffset;
            if (columnIndex >= MONTHS.length * 2) break;

            const monthIndex = Math.floor(columnIndex / 2);
            const field: EditableField =
              columnIndex % 2 === 0 ? "estimatedHours" : "actualHours";
            const month = MONTHS[monthIndex];

            const existingMonth = projectData[month] ?? {
              estimatedHours: 0,
              actualHours: 0,
              overtimeHours: 0,
              workingDays: DEFAULT_WORKING_DAYS[month] || 20,
            };
            projectData[month] = {
              ...existingMonth,
              [field]: parseNumber(cells[colOffset]),
            };
          }

          updated[project.id] = projectData;
        }

        return updated;
      });
    },
    [projects, normalizePasteRows, setWorkHoursData]
  );

  const handleCellPaste = useCallback(
    (
      event: React.ClipboardEvent<HTMLDivElement>,
      projectIndex: number,
      monthIndex: number,
      field: EditableField
    ) => {
      const pasteData = event.clipboardData.getData("text");
      if (!pasteData) return;

      event.preventDefault();
      event.stopPropagation();

      const rows = normalizePasteRows(pasteData);
      if (rows.length > 0) {
        let cells = rows[0];
        if (cells.length >= MONTHS.length * 2 + 1 && !isLikelyNumber(cells[0])) {
          cells = cells.slice(1);
        }
        if (cells.length > 0) {
          event.currentTarget.textContent = String(parseNumber(cells[0]));
        }
      }

      const startColumnIndex = monthIndex * 2 + (field === "actualHours" ? 1 : 0);
      applyPasteData(projectIndex, startColumnIndex, pasteData);
    },
    [normalizePasteRows, applyPasteData]
  );

  // Save handler
  const onSaveClick = useCallback(async () => {
    const success = await handleSave();
    alert(success ? "保存しました" : "保存に失敗しました");
  }, [handleSave]);

  // Memoized project row data
  const projectRowsData = useMemo(() => {
    return projects.map((project, index) => {
      const isFirst = index === 0;
      const isLast = index === projects.length - 1;
      const canMoveUp =
        !isFirst && getGroupKey(projects[index - 1]) === getGroupKey(project);
      const canMoveDown =
        !isLast && getGroupKey(projects[index + 1]) === getGroupKey(project);
      return { project, projectIndex: index, canMoveUp, canMoveDown };
    });
  }, [projects]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toastMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">Kadmin</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCalculateActual}
            disabled={calculating || saving}
          >
            <Calculator className="mr-2 h-4 w-4" />
            {calculating ? "計算中..." : "実績を計算"}
          </Button>
          <Button onClick={onSaveClick} disabled={saving || calculating}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="sr-only">稼働時間一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  {/* Header row 1: Month names */}
                  <TableRow>
                    <TableHead
                      rowSpan={2}
                      className="w-[150px] sticky left-0 bg-background z-10 text-sm"
                    >
                      Project
                    </TableHead>
                    {MONTH_NAMES.map((name) => (
                      <TableHead
                        key={name}
                        colSpan={2}
                        className="text-center min-w-[120px] text-xs"
                      >
                        {name}
                      </TableHead>
                    ))}
                    <TableHead
                      rowSpan={2}
                      colSpan={2}
                      className="text-center min-w-[120px] bg-muted text-xs"
                    >
                      年間合計
                    </TableHead>
                  </TableRow>

                  {/* Header row 2: Estimated/Actual */}
                  <TableRow>
                    {MONTHS.map((month) => (
                      <Fragment key={`${month}-header`}>
                        <TableHead className="text-center text-[11px] min-w-[60px]">
                          予測
                        </TableHead>
                        <TableHead className="text-center text-[11px] min-w-[60px]">
                          実績
                        </TableHead>
                      </Fragment>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* Project rows */}
                  <SortableContext
                    items={projects.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {projectRowsData.map(
                      ({ project, projectIndex, canMoveUp, canMoveDown }) => (
                        <SortableProjectRow
                          key={project.id}
                          project={project}
                          projectIndex={projectIndex}
                          canMoveUp={canMoveUp}
                          canMoveDown={canMoveDown}
                          workHoursData={workHoursData}
                          onCellChange={handleCellChange}
                          onCellPaste={handleCellPaste}
                          onMoveProject={handleMoveProject}
                          calculateYearTotal={calculations.calculateYearTotal}
                        />
                      )
                    )}
                  </SortableContext>

                  {/* Summary rows */}
                  <VacationRow
                    vacationData={vacationData}
                    onVacationChange={handleVacationChange}
                    calculateVacationTotal={calculations.calculateVacationTotal}
                  />

                  <MonthTotalRow
                    calculateMonthTotal={calculations.calculateMonthTotal}
                    calculateGrandTotal={calculations.calculateGrandTotal}
                  />

                  <OvertimeRow
                    calculateOvertimeHours={calculations.calculateOvertimeHours}
                    calculateYearOvertimeHours={calculations.calculateYearOvertimeHours}
                  />

                  <StandardHoursRow
                    workingDaysData={workingDaysData}
                    calculateYearStandardHours={calculations.calculateYearStandardHours}
                  />
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

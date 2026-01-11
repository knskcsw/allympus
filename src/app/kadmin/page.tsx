"use client";

import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Calculator } from "lucide-react";

interface Project {
  id: string;
  code: string;
  name: string;
}

interface WorkHoursData {
  [projectId: string]: {
    [month: number]: {
      estimatedHours: number;
      actualHours: number;
      overtimeHours: number;
      workingDays: number;
    };
  };
}

interface VacationData {
  [month: number]: { hours: number };
}

const FISCAL_YEAR = "FY25";
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]; // April to March
const MONTH_NAMES = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// Default working days per month (営業日) - fallback if API fails
const DEFAULT_WORKING_DAYS: { [key: number]: number } = {
  4: 21, 5: 21, 6: 22, 7: 23, 8: 22, 9: 21, 10: 23, 11: 21, 12: 22,
  1: 20, 2: 20, 3: 21
};

export default function KadminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workHoursData, setWorkHoursData] = useState<WorkHoursData>({});
  const [vacationData, setVacationData] = useState<VacationData>({});
  const [workingDaysData, setWorkingDaysData] = useState<{ [month: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchData(), fetchVacations(), fetchWorkingDays()]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsRes = await fetch("/api/projects");
      const projectsData = await projectsRes.json();
      setProjects(projectsData);

      // Fetch work hours
      const workHoursRes = await fetch(`/api/kadmin/work-hours?fiscalYear=${FISCAL_YEAR}`);
      const workHoursDataRaw = await workHoursRes.json();

      // Transform to nested object
      const transformed: WorkHoursData = {};
      for (const item of workHoursDataRaw) {
        if (!transformed[item.projectId]) {
          transformed[item.projectId] = {};
        }
        transformed[item.projectId][item.month] = {
          estimatedHours: item.estimatedHours,
          actualHours: item.actualHours,
          overtimeHours: item.overtimeHours,
          workingDays: item.workingDays || DEFAULT_WORKING_DAYS[item.month] || 20,
        };
      }

      // Initialize empty data for projects/months without data
      for (const project of projectsData) {
        if (!transformed[project.id]) {
          transformed[project.id] = {};
        }
        for (const month of MONTHS) {
          if (!transformed[project.id][month]) {
            transformed[project.id][month] = {
              estimatedHours: 0,
              actualHours: 0,
              overtimeHours: 0,
              workingDays: DEFAULT_WORKING_DAYS[month] || 20,
            };
          }
        }
      }

      setWorkHoursData(transformed);
    } catch (error) {
      console.error("Failed to fetch work hours data:", error);
    }
  };

  const fetchVacations = async () => {
    try {
      const res = await fetch(`/api/kadmin/monthly-vacation?fiscalYear=${FISCAL_YEAR}`);
      const monthlyVacations = await res.json();

      // Convert to month-keyed object
      const aggregated: VacationData = {};
      for (const vacation of monthlyVacations) {
        aggregated[vacation.month] = { hours: vacation.hours };
      }

      // Initialize empty months
      for (const month of MONTHS) {
        if (!aggregated[month]) {
          aggregated[month] = { hours: 0 };
        }
      }

      setVacationData(aggregated);
    } catch (error) {
      console.error("Failed to fetch vacations:", error);
      // Initialize empty data on error
      const empty: VacationData = {};
      for (const month of MONTHS) {
        empty[month] = { hours: 0 };
      }
      setVacationData(empty);
    }
  };

  const fetchWorkingDays = async () => {
    try {
      const res = await fetch(`/api/holidays/working-days?fiscalYear=${FISCAL_YEAR}`);
      const data = await res.json();
      setWorkingDaysData(data.workingDays);
    } catch (error) {
      console.error("Failed to fetch working days:", error);
      // Fallback to default working days
      setWorkingDaysData(DEFAULT_WORKING_DAYS);
    }
  };

  const handleCellChange = (
    projectId: string,
    month: number,
    field: "estimatedHours" | "actualHours" | "overtimeHours" | "workingDays",
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setWorkHoursData((prev) => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [month]: {
          ...prev[projectId][month],
          [field]: numValue,
        },
      },
    }));
  };

  const handleVacationChange = (month: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setVacationData((prev) => ({
      ...prev,
      [month]: {
        hours: numValue,
      },
    }));
  };

  const handleTablePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text");
    if (!pasteData) return;

    // Parse TSV data (tab-separated values from Excel)
    const rows = pasteData.split("\n").filter((row) => row.trim());
    if (rows.length === 0) return;

    e.preventDefault();

    // Try to parse and apply data
    // Expected format: each row has project name and then 12 pairs of values (est, actual)
    // or just 12 values for actual hours
    const updates = { ...workHoursData };

    for (let i = 0; i < rows.length && i < projects.length; i++) {
      const cells = rows[i].split("\t");
      const project = projects[i];

      // Skip project name cell (first cell)
      let cellIndex = 1;

      for (let monthIdx = 0; monthIdx < MONTHS.length; monthIdx++) {
        const month = MONTHS[monthIdx];

        if (!updates[project.id]) {
          updates[project.id] = {};
        }
        if (!updates[project.id][month]) {
          updates[project.id][month] = {
            estimatedHours: 0,
            actualHours: 0,
            overtimeHours: 0,
            workingDays: DEFAULT_WORKING_DAYS[month] || 20,
          };
        }

        // Try to read estimated and actual hours
        const estValue = parseFloat(cells[cellIndex]?.trim() || "0") || 0;
        const actValue = parseFloat(cells[cellIndex + 1]?.trim() || "0") || 0;

        updates[project.id][month].estimatedHours = estValue;
        updates[project.id][month].actualHours = actValue;

        cellIndex += 2;
      }
    }

    setWorkHoursData(updates);
    alert("データを貼り付けました");
  };

  const calculateStandardHours = (workingDays: number) => {
    return workingDays * 7.5;
  };

  // 各プロジェクトの年間合計（横方向）
  const calculateYearTotal = (projectId: string, field: "estimatedHours" | "actualHours") => {
    let total = 0;
    for (const month of MONTHS) {
      total += workHoursData[projectId]?.[month]?.[field] || 0;
    }
    return total;
  };

  // 各月の全プロジェクト合計（縦方向）
  const calculateMonthTotal = (month: number, field: "estimatedHours" | "actualHours") => {
    let total = 0;
    for (const project of projects) {
      total += workHoursData[project.id]?.[month]?.[field] || 0;
    }
    return total;
  };

  // 総合計（全プロジェクト・全月）
  const calculateGrandTotal = (field: "estimatedHours" | "actualHours") => {
    let total = 0;
    for (const month of MONTHS) {
      total += calculateMonthTotal(month, field);
    }
    return total;
  };

  // 休暇の年間合計
  const calculateVacationTotal = () => {
    let total = 0;
    for (const month of MONTHS) {
      total += vacationData[month]?.hours || 0;
    }
    return total;
  };

  // 年間標準稼働時間
  const calculateYearStandardHours = () => {
    let total = 0;
    for (const month of MONTHS) {
      const workingDays = workingDaysData[month] || DEFAULT_WORKING_DAYS[month] || 20;
      total += calculateStandardHours(workingDays);
    }
    return total;
  };

  // 残業時間計算: 月別合計(実績) - (標準時間 - 休暇)
  const calculateOvertimeHours = (month: number) => {
    const actualTotal = calculateMonthTotal(month, "actualHours");
    const workingDays = workingDaysData[month] || DEFAULT_WORKING_DAYS[month] || 20;
    const standardHours = calculateStandardHours(workingDays);
    const vacationHours = vacationData[month]?.hours || 0;
    const expectedHours = standardHours - vacationHours;
    return actualTotal - expectedHours;
  };

  // 年間残業時間合計
  const calculateYearOvertimeHours = () => {
    let total = 0;
    for (const month of MONTHS) {
      total += calculateOvertimeHours(month);
    }
    return total;
  };

  const handleCalculateActual = async () => {
    if (!confirm("タスクの実績時間で「実績」列を上書きしますか？")) {
      return;
    }

    setCalculating(true);
    try {
      const res = await fetch(`/api/kadmin/actual-hours?fiscalYear=${FISCAL_YEAR}`);
      const actualHours = await res.json();

      // Update workHoursData with actual hours
      setWorkHoursData((prev) => {
        const updated = { ...prev };

        // Reset all actual hours to 0
        for (const projectId in updated) {
          for (const month of MONTHS) {
            if (updated[projectId][month]) {
              updated[projectId][month].actualHours = 0;
            }
          }
        }

        // Apply calculated actual hours
        for (const item of actualHours) {
          if (updated[item.projectId] && updated[item.projectId][item.month]) {
            updated[item.projectId][item.month].actualHours = item.hours;
          }
        }

        return updated;
      });

      alert("実績時間を計算しました");
    } catch (error) {
      console.error("Failed to calculate actual hours:", error);
      alert("実績時間の計算に失敗しました");
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save work hours
      const updates = [];
      for (const projectId in workHoursData) {
        for (const month of MONTHS) {
          const data = workHoursData[projectId][month];
          updates.push({
            projectId,
            fiscalYear: FISCAL_YEAR,
            month,
            estimatedHours: data.estimatedHours,
            actualHours: data.actualHours,
            overtimeHours: data.overtimeHours,
            workingDays: data.workingDays,
          });
        }
      }

      // Save vacation hours
      const vacationUpdates = [];
      for (const month of MONTHS) {
        vacationUpdates.push({
          fiscalYear: FISCAL_YEAR,
          month,
          hours: vacationData[month]?.hours || 0,
        });
      }

      await Promise.all([
        fetch("/api/kadmin/work-hours", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        }),
        fetch("/api/kadmin/monthly-vacation", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates: vacationUpdates }),
        }),
      ]);

      alert("保存しました");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
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
          <Button onClick={handleSave} disabled={saving || calculating}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>稼働時間一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto" onPaste={handleTablePaste}>
            <Table>
              <TableHeader>
                {/* ヘッダー第1行: 月名 */}
                <TableRow>
                  <TableHead rowSpan={2} className="w-[200px] sticky left-0 bg-background z-10">
                    プロジェクト
                  </TableHead>
                  {MONTH_NAMES.map((name) => (
                    <TableHead key={name} colSpan={2} className="text-center min-w-[160px]">
                      {name}
                    </TableHead>
                  ))}
                  <TableHead rowSpan={2} colSpan={2} className="text-center min-w-[160px] bg-muted">
                    年間合計
                  </TableHead>
                </TableRow>
                {/* ヘッダー第2行: 予測/実績 */}
                <TableRow>
                  {MONTHS.map((month) => (
                    <Fragment key={`${month}-header`}>
                      <TableHead className="text-center text-xs min-w-[80px]">
                        予測
                      </TableHead>
                      <TableHead className="text-center text-xs min-w-[80px]">
                        実績
                      </TableHead>
                    </Fragment>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* プロジェクト行 */}
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="sticky left-0 bg-background font-medium z-10">
                      {project.code} - {project.name}
                    </TableCell>
                    {/* 12ヶ月×2列 */}
                    {MONTHS.map((month) => (
                      <Fragment key={`${project.id}-${month}`}>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={workHoursData[project.id]?.[month]?.estimatedHours || 0}
                            onChange={(e) =>
                              handleCellChange(project.id, month, "estimatedHours", e.target.value)
                            }
                            className="h-8 text-right"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={workHoursData[project.id]?.[month]?.actualHours || 0}
                            onChange={(e) =>
                              handleCellChange(project.id, month, "actualHours", e.target.value)
                            }
                            className="h-8 text-right"
                          />
                        </TableCell>
                      </Fragment>
                    ))}
                    {/* 年間合計列 */}
                    <TableCell className="text-right font-medium bg-muted">
                      {calculateYearTotal(project.id, "estimatedHours").toFixed(1)}h
                    </TableCell>
                    <TableCell className="text-right font-medium bg-muted">
                      {calculateYearTotal(project.id, "actualHours").toFixed(1)}h
                    </TableCell>
                  </TableRow>
                ))}

                {/* 休暇行 */}
                <TableRow className="bg-blue-50 dark:bg-blue-950">
                  <TableCell className="sticky left-0 bg-blue-50 dark:bg-blue-950 font-medium z-10">
                    休暇
                  </TableCell>
                  {MONTHS.map((month) => (
                    <Fragment key={`vacation-${month}`}>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        -
                      </TableCell>
                      <TableCell className="bg-blue-50 dark:bg-blue-950">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={vacationData[month]?.hours || 0}
                          onChange={(e) => handleVacationChange(month, e.target.value)}
                          className="h-8 text-right"
                        />
                      </TableCell>
                    </Fragment>
                  ))}
                  {/* 年間合計 */}
                  <TableCell className="text-center text-muted-foreground bg-blue-100 dark:bg-blue-900">
                    -
                  </TableCell>
                  <TableCell className="text-right font-medium bg-blue-100 dark:bg-blue-900">
                    {calculateVacationTotal().toFixed(1)}h
                  </TableCell>
                </TableRow>

                {/* 月別合計行（縦方向集計） */}
                <TableRow className="bg-green-50 dark:bg-green-950 font-bold">
                  <TableCell className="sticky left-0 bg-green-50 dark:bg-green-950 z-10">
                    月別合計
                  </TableCell>
                  {MONTHS.map((month) => (
                    <Fragment key={`month-total-${month}`}>
                      <TableCell className="text-right">
                        {calculateMonthTotal(month, "estimatedHours").toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {calculateMonthTotal(month, "actualHours").toFixed(1)}h
                      </TableCell>
                    </Fragment>
                  ))}
                  {/* 総合計 */}
                  <TableCell className="text-right bg-green-100 dark:bg-green-900">
                    {calculateGrandTotal("estimatedHours").toFixed(1)}h
                  </TableCell>
                  <TableCell className="text-right bg-green-100 dark:bg-green-900">
                    {calculateGrandTotal("actualHours").toFixed(1)}h
                  </TableCell>
                </TableRow>

                {/* 残業時間行 */}
                <TableRow className="bg-orange-50 dark:bg-orange-950 font-bold">
                  <TableCell className="sticky left-0 bg-orange-50 dark:bg-orange-950 z-10">
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
                        }`}
                      >
                        {overtime.toFixed(1)}h
                      </TableCell>
                    );
                  })}
                  {/* 年間残業時間合計 */}
                  <TableCell
                    colSpan={2}
                    className="text-center bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
                  >
                    {calculateYearOvertimeHours().toFixed(1)}h
                  </TableCell>
                </TableRow>

                {/* 標準時間行（参考情報） */}
                <TableRow className="bg-muted/50">
                  <TableCell className="sticky left-0 bg-muted/50 font-medium text-sm z-10">
                    標準時間
                  </TableCell>
                  {MONTHS.map((month) => {
                    const workingDays = workingDaysData[month] || DEFAULT_WORKING_DAYS[month] || 20;
                    const standardHours = calculateStandardHours(workingDays);
                    return (
                      <TableCell key={`${month}-std`} colSpan={2} className="text-center text-sm">
                        {standardHours.toFixed(1)}h ({workingDays}日)
                      </TableCell>
                    );
                  })}
                  {/* 年間合計 */}
                  <TableCell colSpan={2} className="text-center text-sm bg-muted">
                    {calculateYearStandardHours().toFixed(1)}h
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

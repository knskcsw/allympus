"use client";

import { useEffect, useState } from "react";
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
import { Save } from "lucide-react";

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

const FISCAL_YEAR = "FY25";
const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]; // April to March
const MONTH_NAMES = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

// Default working days per month (営業日)
const DEFAULT_WORKING_DAYS: { [key: number]: number } = {
  4: 21, 5: 21, 6: 22, 7: 23, 8: 22, 9: 21, 10: 23, 11: 21, 12: 22,
  1: 20, 2: 20, 3: 21
};

export default function KadminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [workHoursData, setWorkHoursData] = useState<WorkHoursData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
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

  const calculateStandardHours = (workingDays: number) => {
    return workingDays * 7.5;
  };

  const calculateTotal = (projectId: string, field: "estimatedHours" | "actualHours" | "overtimeHours") => {
    let total = 0;
    for (const month of MONTHS) {
      total += workHoursData[projectId]?.[month]?.[field] || 0;
    }
    return total;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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

      await fetch("/api/kadmin/work-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

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
          <p className="text-muted-foreground mt-2">
            プロジェクト別月次稼働時間管理 ({FISCAL_YEAR})
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "保存中..." : "保存"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>稼働時間一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-background">プロジェクト</TableHead>
                  <TableHead className="w-[100px]">項目</TableHead>
                  {MONTH_NAMES.map((name) => (
                    <TableHead key={name} className="text-center min-w-[100px]">
                      {name}
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[100px]">合計</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <>
                    {/* 見積もり行 */}
                    <TableRow key={`${project.id}-estimated`}>
                      <TableCell rowSpan={4} className="font-medium sticky left-0 bg-background">
                        {project.code} - {project.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">見積</TableCell>
                      {MONTHS.map((month, idx) => (
                        <TableCell key={month}>
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
                      ))}
                      <TableCell className="text-right font-medium">
                        {calculateTotal(project.id, "estimatedHours").toFixed(1)}
                      </TableCell>
                    </TableRow>

                    {/* 実績行 */}
                    <TableRow key={`${project.id}-actual`}>
                      <TableCell className="text-sm text-muted-foreground">実績</TableCell>
                      {MONTHS.map((month) => (
                        <TableCell key={month}>
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
                      ))}
                      <TableCell className="text-right font-medium">
                        {calculateTotal(project.id, "actualHours").toFixed(1)}
                      </TableCell>
                    </TableRow>

                    {/* 残業行 */}
                    <TableRow key={`${project.id}-overtime`}>
                      <TableCell className="text-sm text-muted-foreground">残業</TableCell>
                      {MONTHS.map((month) => (
                        <TableCell key={month}>
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={workHoursData[project.id]?.[month]?.overtimeHours || 0}
                            onChange={(e) =>
                              handleCellChange(project.id, month, "overtimeHours", e.target.value)
                            }
                            className="h-8 text-right"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-medium">
                        {calculateTotal(project.id, "overtimeHours").toFixed(1)}
                      </TableCell>
                    </TableRow>

                    {/* 標準稼働時間行 */}
                    <TableRow key={`${project.id}-standard`} className="bg-muted/50">
                      <TableCell className="text-sm text-muted-foreground">標準時間</TableCell>
                      {MONTHS.map((month) => {
                        const workingDays = workHoursData[project.id]?.[month]?.workingDays || DEFAULT_WORKING_DAYS[month] || 20;
                        const standardHours = calculateStandardHours(workingDays);
                        return (
                          <TableCell key={month} className="text-right text-sm">
                            {standardHours.toFixed(1)}h
                            <br />
                            <span className="text-xs text-muted-foreground">({workingDays}日)</span>
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-right text-sm">
                        {MONTHS.reduce((sum, month) => {
                          const workingDays = workHoursData[project.id]?.[month]?.workingDays || DEFAULT_WORKING_DAYS[month] || 20;
                          return sum + calculateStandardHours(workingDays);
                        }, 0).toFixed(1)}h
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>休暇管理</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            休暇管理機能は今後実装予定です
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface WbsSummary {
  projectId: string | null;
  projectName: string;
  projectAbbreviation: string | null;
  wbsId: string | null;
  wbsName: string;
  totalSeconds: number;
  totalHours: number;
  taskNames: string[];
}

interface WbsSummaryCardProps {
  summary: WbsSummary[];
  totalWorkingHours?: number | null;
}

export default function WbsSummaryCard({
  summary,
  totalWorkingHours = null,
}: WbsSummaryCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const isBreakProject = (item: WbsSummary) => {
    const labels = [item.projectName, item.projectAbbreviation]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    return labels.some((value) => value === "休憩" || value === "break");
  };

  // Calculate total hours across all entries (exclude break)
  const totalHours = summary.reduce(
    (acc, item) => acc + (isBreakProject(item) ? 0 : item.totalHours),
    0
  );
  const hasWorkingHours =
    typeof totalWorkingHours === "number" && Number.isFinite(totalWorkingHours);
  const hasMismatch =
    hasWorkingHours && Math.abs(totalHours - totalWorkingHours) > 0.01;

  // Group by project
  const groupedByProject = summary.reduce((acc, item, index) => {
    const key = item.projectName;
    if (!acc.has(key)) {
      acc.set(key, {
        projectName: item.projectName,
        projectAbbreviation: item.projectAbbreviation,
        items: [],
        totalHours: 0,
        order: index,
        isBreak: isBreakProject(item),
      });
    }
    const group = acc.get(key);
    if (group) {
      group.items.push(item);
      group.totalHours += item.totalHours;
    }
    return acc;
  }, new Map<string, { projectName: string; projectAbbreviation: string | null; items: WbsSummary[]; totalHours: number; order: number; isBreak: boolean }>());
  const groupedProjects = Array.from(groupedByProject.values()).sort((a, b) => {
    if (a.isBreak !== b.isBreak) return a.isBreak ? 1 : -1;
    return a.order - b.order;
  });

  return (
    <Card>
      <CardHeader
        className={`flex flex-row items-center justify-between ${
          isOpen ? "" : "py-2"
        }`}
      >
        <CardTitle className={isOpen ? "" : "text-sm"}>WBS集計</CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-base font-semibold${
              hasMismatch ? " border-destructive text-destructive" : ""
            }`}
          >
            合計: {totalHours.toFixed(2)}h
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            {isOpen ? (
              <span className="flex items-center gap-1">
                折りたたむ
                <ChevronUp className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center gap-1">
                開く
                <ChevronDown className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {summary.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              稼働実績がありません
            </p>
          ) : (
            <div className="space-y-4">
              {groupedProjects.map((group) => (
                <div key={group.projectName} className="space-y-2">
                  <div className="flex items-center justify-between border-b pb-1">
                    <h3 className="font-semibold text-sm">
                      {group.projectAbbreviation || group.projectName}
                    </h3>
                    <span className="text-sm font-semibold text-primary">
                      {group.totalHours.toFixed(2)}h
                    </span>
                  </div>
                  <div className="space-y-1 ml-4">
                    {group.items.map((item) => (
                      <div
                        key={`${item.projectId}-${item.wbsId}`}
                        className="flex items-center justify-between text-sm gap-2"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-muted-foreground flex-shrink-0">
                            {item.wbsName}
                          </span>
                          {item.taskNames && item.taskNames.length > 0 && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.taskNames.join(' / ')}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-medium flex-shrink-0">
                          {item.totalHours.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WbsSummary {
  projectId: string | null;
  projectName: string;
  projectAbbreviation: string | null;
  wbsId: string | null;
  wbsName: string;
  totalSeconds: number;
  totalHours: number;
}

interface WbsSummaryCardProps {
  summary: WbsSummary[];
}

export default function WbsSummaryCard({ summary }: WbsSummaryCardProps) {
  // Calculate total hours across all entries
  const totalHours = summary.reduce((acc, item) => acc + item.totalHours, 0);

  // Group by project
  const groupedByProject = summary.reduce((acc, item) => {
    const key = item.projectName;
    if (!acc[key]) {
      acc[key] = {
        projectName: item.projectName,
        projectAbbreviation: item.projectAbbreviation,
        items: [],
        totalHours: 0,
      };
    }
    acc[key].items.push(item);
    acc[key].totalHours += item.totalHours;
    return acc;
  }, {} as Record<string, { projectName: string; projectAbbreviation: string | null; items: WbsSummary[]; totalHours: number }>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>WBS集計</CardTitle>
          <Badge variant="outline" className="text-lg font-semibold">
            合計: {totalHours.toFixed(2)}h
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {summary.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            稼働実績がありません
          </p>
        ) : (
          <div className="space-y-4">
            {Object.values(groupedByProject).map((group) => (
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
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {item.wbsName}
                      </span>
                      <span className="font-mono font-medium">
                        {item.totalHours.toFixed(2)}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

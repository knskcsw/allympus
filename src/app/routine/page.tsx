"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MorningRoutineTemplateCard } from "@/components/routine/MorningRoutineTemplateCard";
import { RoutineTasksCard } from "@/components/routine/RoutineTasksCard";
import WorkScheduleTemplates from "@/components/routine/WorkScheduleTemplates";
import { useRoutineData } from "@/hooks/useRoutineData";
import { apiRequest } from "@/lib/api";

type PendingDelete =
  | { kind: "template"; id: string }
  | { kind: "task"; id: string }
  | null;

export default function RoutinePage() {
  const {
    templateItems,
    routineTasks,
    isLoading,
    errorMessage,
    fetchRoutineData,
  } = useRoutineData();

  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDelete) return;

    const { kind, id } = pendingDelete;
    setPendingDelete(null);
    setIsDeleting(true);

    try {
      const endpoint =
        kind === "template"
          ? `/api/morning-routine-template/${id}`
          : `/api/routine-tasks/${id}`;
      await apiRequest(endpoint, { method: "DELETE" });
      fetchRoutineData();
    } catch (error) {
      console.error(`Failed to delete ${kind}:`, error);
      const message =
        kind === "template"
          ? "テンプレートの削除に失敗しました"
          : "Routine Tasksの削除に失敗しました";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, fetchRoutineData]);

  const handleTemplateDeleteRequest = useCallback((id: string) => {
    setPendingDelete({ kind: "template", id });
  }, []);

  const handleTaskDeleteRequest = useCallback((id: string) => {
    setPendingDelete({ kind: "task", id });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-sm">読み込み中...</div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-screen px-6">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>読み込みに失敗しました</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Button onClick={fetchRoutineData}>再読み込み</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deleteDialogTitle =
    pendingDelete?.kind === "template"
      ? "このテンプレートを削除してもよろしいですか？"
      : "このタスクを削除してもよろしいですか？";

  return (
    <div className="space-y-4 p-6 min-h-screen">
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={deleteDialogTitle}
        description="この操作は取り消しできません。"
        confirmText="削除"
        cancelText="キャンセル"
        confirmVariant="destructive"
        confirmDisabled={isDeleting}
        onConfirm={handleDeleteConfirm}
      />

      <h1 className="text-3xl font-bold">Routine Settings</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <MorningRoutineTemplateCard
          items={templateItems}
          onRefresh={fetchRoutineData}
          onDeleteRequest={handleTemplateDeleteRequest}
          isDeleteDisabled={isDeleting}
        />

        <RoutineTasksCard
          tasks={routineTasks}
          onRefresh={fetchRoutineData}
          onDeleteRequest={handleTaskDeleteRequest}
          isDeleteDisabled={isDeleting}
        />

        <WorkScheduleTemplates />
      </div>
    </div>
  );
}

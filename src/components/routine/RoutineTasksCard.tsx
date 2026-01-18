"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableListItem } from "./EditableListItem";
import { AddItemForm } from "./AddItemForm";
import { useEditableList } from "@/hooks/useEditableList";
import type { RoutineTask } from "@/types/routine";

type RoutineTasksCardProps = {
  tasks: RoutineTask[];
  onRefresh: () => void;
  onDeleteRequest: (id: string) => void;
  isDeleteDisabled: boolean;
};

export const RoutineTasksCard = memo(function RoutineTasksCard({
  tasks,
  onRefresh,
  onDeleteRequest,
  isDeleteDisabled,
}: RoutineTasksCardProps) {
  const {
    draft,
    setDraft,
    editingId,
    editingTitle,
    setEditingTitle,
    isSubmitting,
    handleCreate,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
  } = useEditableList<RoutineTask>({
    baseEndpoint: "/api/routine-tasks",
    updateMethod: "PUT",
    onMutationSuccess: onRefresh,
    createErrorMessage: "Routine Tasksの追加に失敗しました",
    updateErrorMessage: "Routine Tasksの更新に失敗しました",
    deleteErrorMessage: "Routine Tasksの削除に失敗しました",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routine Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            ルーティンタスクがありません
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <EditableListItem
                key={task.id}
                title={task.title}
                isEditing={editingId === task.id}
                editingTitle={editingTitle}
                isSubmitting={isSubmitting || isDeleteDisabled}
                onEditTitleChange={setEditingTitle}
                onEditStart={() => handleEditStart(task)}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onDeleteRequest={() => onDeleteRequest(task.id)}
                variant="card"
              />
            ))}
          </div>
        )}
        <AddItemForm
          value={draft}
          onChange={setDraft}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          placeholder="Routine Tasksを追加"
          buttonText="追加"
          direction="vertical"
        />
      </CardContent>
    </Card>
  );
});

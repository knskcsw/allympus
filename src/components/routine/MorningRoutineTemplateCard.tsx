"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditableListItem } from "./EditableListItem";
import { AddItemForm } from "./AddItemForm";
import { useEditableList } from "@/hooks/useEditableList";
import type { TemplateItem } from "@/types/routine";

type MorningRoutineTemplateCardProps = {
  items: TemplateItem[];
  onRefresh: () => void;
  onDeleteRequest: (id: string) => void;
  isDeleteDisabled: boolean;
};

export const MorningRoutineTemplateCard = memo(function MorningRoutineTemplateCard({
  items,
  onRefresh,
  onDeleteRequest,
  isDeleteDisabled,
}: MorningRoutineTemplateCardProps) {
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
  } = useEditableList<TemplateItem>({
    baseEndpoint: "/api/morning-routine-template",
    updateMethod: "PATCH",
    onMutationSuccess: onRefresh,
    createErrorMessage: "テンプレートの追加に失敗しました",
    updateErrorMessage: "テンプレートの更新に失敗しました",
    deleteErrorMessage: "テンプレートの削除に失敗しました",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Morning Routine Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            テンプレートがありません
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <EditableListItem
                key={item.id}
                title={item.title}
                isEditing={editingId === item.id}
                editingTitle={editingTitle}
                isSubmitting={isSubmitting || isDeleteDisabled}
                onEditTitleChange={setEditingTitle}
                onEditStart={() => handleEditStart(item)}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onDeleteRequest={() => onDeleteRequest(item.id)}
                variant="inline"
              />
            ))}
          </div>
        )}
        <AddItemForm
          value={draft}
          onChange={setDraft}
          onSubmit={handleCreate}
          isSubmitting={isSubmitting}
          placeholder="テンプレートを追加"
          buttonText="追加"
          direction="horizontal"
        />
      </CardContent>
    </Card>
  );
});

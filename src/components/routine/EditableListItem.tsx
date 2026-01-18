"use client";

import { memo, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";

type EditableListItemProps = {
  title: string;
  isEditing: boolean;
  editingTitle: string;
  isSubmitting: boolean;
  onEditTitleChange: (value: string) => void;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteRequest: () => void;
  /** Visual variant */
  variant?: "inline" | "card";
};

export const EditableListItem = memo(function EditableListItem({
  title,
  isEditing,
  editingTitle,
  isSubmitting,
  onEditTitleChange,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  variant = "inline",
}: EditableListItemProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEditSave();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      onEditCancel();
    }
  };

  if (variant === "card") {
    return (
      <div className="rounded-lg border p-3 text-sm">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={editingTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onEditSave} disabled={isSubmitting}>
                保存
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onEditCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium">{title}</div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onEditStart}
                disabled={isSubmitting}
                aria-label="編集"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteRequest();
                }}
                disabled={isSubmitting}
                aria-label="削除"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline variant (default)
  return (
    <div className="flex items-center gap-3 text-sm">
      {isEditing ? (
        <Input
          value={editingTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span>{title}</span>
      )}
      <div className="ml-auto flex items-center gap-2">
        {isEditing ? (
          <>
            <Button size="sm" onClick={onEditSave} disabled={isSubmitting}>
              保存
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEditCancel}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onEditStart}
              disabled={isSubmitting}
              aria-label="編集"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteRequest();
              }}
              disabled={isSubmitting}
              aria-label="削除"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

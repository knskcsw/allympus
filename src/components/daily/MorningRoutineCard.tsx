"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import type { MorningRoutineItem } from "@/types/daily";

interface RoutineItemRowProps {
  item: MorningRoutineItem;
  isEditing: boolean;
  editingTitle: string;
  isSubmitting: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onEditStart: (id: string, title: string) => void;
  onEditCancel: () => void;
  onEditSave: (id: string) => void;
  onEditTitleChange: (title: string) => void;
  onDelete: (id: string) => void;
}

const RoutineItemRow = memo(function RoutineItemRow({
  item,
  isEditing,
  editingTitle,
  isSubmitting,
  onToggle,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditTitleChange,
  onDelete,
}: RoutineItemRowProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Checkbox
        checked={item.completed}
        onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
      />
      {isEditing ? (
        <Input
          value={editingTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEditSave(item.id);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onEditCancel();
            }
          }}
        />
      ) : (
        <button
          type="button"
          className={`text-left ${
            item.completed ? "text-muted-foreground line-through" : ""
          }`}
          onClick={() => onToggle(item.id, !item.completed)}
        >
          {item.title}
        </button>
      )}
      <div className="ml-auto flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              size="sm"
              onClick={() => onEditSave(item.id)}
              disabled={isSubmitting}
            >
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
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEditStart(item.id, item.title)}
              disabled={isSubmitting}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(item.id)}
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

interface MorningRoutineCardProps {
  routineItems: MorningRoutineItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  routineTitleDraft: string;
  onRoutineTitleDraftChange: (title: string) => void;
  editingRoutineId: string | null;
  editingRoutineTitle: string;
  onEditingRoutineTitleChange: (title: string) => void;
  isSubmitting: boolean;
  isImporting: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onCreate: () => void;
  onImport: () => void;
  onEditStart: (id: string, title: string) => void;
  onEditCancel: () => void;
  onEditSave: (id: string) => void;
  onDelete: (id: string) => void;
}

function MorningRoutineCard({
  routineItems,
  isOpen,
  onOpenChange,
  routineTitleDraft,
  onRoutineTitleDraftChange,
  editingRoutineId,
  editingRoutineTitle,
  onEditingRoutineTitleChange,
  isSubmitting,
  isImporting,
  onToggle,
  onCreate,
  onImport,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
}: MorningRoutineCardProps) {
  return (
    <Card>
      <CardHeader
        className={`flex flex-row items-center justify-between ${
          isOpen ? "" : "py-2"
        }`}
      >
        <CardTitle className={isOpen ? "" : "text-sm"}>
          Morning Routine
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onImport}
            disabled={isImporting}
          >
            {isImporting ? "取り込み中..." : "Import"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenChange(!isOpen)}
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
        <CardContent className="space-y-4">
          {routineItems.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              ルーティンを追加してください
            </div>
          ) : (
            <div className="space-y-3">
              {routineItems.map((item) => (
                <RoutineItemRow
                  key={item.id}
                  item={item}
                  isEditing={editingRoutineId === item.id}
                  editingTitle={editingRoutineTitle}
                  isSubmitting={isSubmitting}
                  onToggle={onToggle}
                  onEditStart={onEditStart}
                  onEditCancel={onEditCancel}
                  onEditSave={onEditSave}
                  onEditTitleChange={onEditingRoutineTitleChange}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={routineTitleDraft}
              onChange={(e) => onRoutineTitleDraftChange(e.target.value)}
              placeholder="新しいルーティンを追加"
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCreate();
                }
              }}
            />
            <Button onClick={onCreate} disabled={isSubmitting}>
              追加
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default memo(MorningRoutineCard);

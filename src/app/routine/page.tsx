"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WorkScheduleTemplates from "@/components/routine/WorkScheduleTemplates";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type TemplateItem = {
  id: string;
  title: string;
};

type RoutineTask = {
  id: string;
  title: string;
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  if (!response.ok) {
    let message = text;
    try {
      message = JSON.parse(text).error || text;
    } catch {
      // Fallback to raw text when not JSON.
    }
    throw new Error(message || "Request failed");
  }
  return text ? JSON.parse(text) : null;
}

export default function RoutinePage() {
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [routineTasks, setRoutineTasks] = useState<RoutineTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "template"; id: string }
    | { kind: "task"; id: string }
    | null
  >(null);

  const [templateTitleDraft, setTemplateTitleDraft] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateTitle, setEditingTemplateTitle] = useState("");
  const [isTemplateSubmitting, setIsTemplateSubmitting] = useState(false);

  const [taskTitleDraft, setTaskTitleDraft] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  const fetchRoutineData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [templateResponse, tasksResponse] = await Promise.all([
        fetch("/api/morning-routine-template", { cache: "no-store" }),
        fetch("/api/routine-tasks", { cache: "no-store" }),
      ]);
      const [templates, tasks] = await Promise.all([
        parseJsonResponse(templateResponse),
        parseJsonResponse(tasksResponse),
      ]);
      setTemplateItems(templates || []);
      setRoutineTasks(tasks || []);
    } catch (error) {
      console.error("Failed to load routine data:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load routine data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutineData();
  }, [fetchRoutineData]);

  const handleTemplateCreate = async () => {
    const title = templateTitleDraft.trim();
    if (!title) return;
    setIsTemplateSubmitting(true);
    try {
      const response = await fetch("/api/morning-routine-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      await parseJsonResponse(response);
      setTemplateTitleDraft("");
      fetchRoutineData();
    } catch (error) {
      console.error("Failed to create template item:", error);
      alert("テンプレートの追加に失敗しました");
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  const handleTemplateEditStart = (item: TemplateItem) => {
    setEditingTemplateId(item.id);
    setEditingTemplateTitle(item.title);
  };

  const handleTemplateEditCancel = () => {
    setEditingTemplateId(null);
    setEditingTemplateTitle("");
  };

  const handleTemplateEditSave = async () => {
    if (!editingTemplateId) return;
    const title = editingTemplateTitle.trim();
    if (!title) return;
    setIsTemplateSubmitting(true);
    try {
      const response = await fetch(
        `/api/morning-routine-template/${editingTemplateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );
      await parseJsonResponse(response);
      handleTemplateEditCancel();
      fetchRoutineData();
    } catch (error) {
      console.error("Failed to update template item:", error);
      alert("テンプレートの更新に失敗しました");
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  const handleTemplateDelete = async (id: string) => {
    setIsTemplateSubmitting(true);
    try {
      const response = await fetch(`/api/morning-routine-template/${id}`, {
        method: "DELETE",
      });
      await parseJsonResponse(response);
      if (editingTemplateId === id) {
        handleTemplateEditCancel();
      }
      fetchRoutineData();
    } catch (error) {
      console.error("Failed to delete template item:", error);
      alert("テンプレートの削除に失敗しました");
    } finally {
      setIsTemplateSubmitting(false);
    }
  };

  const handleTaskCreate = async () => {
    const title = taskTitleDraft.trim();
    if (!title) return;
    setIsTaskSubmitting(true);
    try {
      const response = await fetch("/api/routine-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      await parseJsonResponse(response);
      setTaskTitleDraft("");
      fetchRoutineData();
    } catch (error) {
      console.error("Failed to create routine task:", error);
      alert("Routine Tasksの追加に失敗しました");
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleTaskEditStart = (task: RoutineTask) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleTaskEditCancel = () => {
    setEditingTaskId(null);
    setEditingTaskTitle("");
  };

  const handleTaskEditSave = async () => {
    if (!editingTaskId) return;
    const title = editingTaskTitle.trim();
    if (!title) return;
    setIsTaskSubmitting(true);
    try {
      const response = await fetch(`/api/routine-tasks/${editingTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      await parseJsonResponse(response);
      handleTaskEditCancel();
      fetchRoutineData();
    } catch (error) {
      console.error("Failed to update routine task:", error);
      alert("Routine Tasksの更新に失敗しました");
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleTaskDelete = async (id: string) => {
    setIsTaskSubmitting(true);
    try {
      const response = await fetch(`/api/routine-tasks/${id}`, {
        method: "DELETE",
      });
      await parseJsonResponse(response);
      if (editingTaskId === id) {
        handleTaskEditCancel();
      }
      fetchRoutineData();
    } catch (error) {
      console.error("Failed to delete routine task:", error);
      alert("Routine Tasksの削除に失敗しました");
    } finally {
      setIsTaskSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-4 p-6 min-h-screen">
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete?.kind === "template"
            ? "このテンプレートを削除してもよろしいですか？"
            : "このタスクを削除してもよろしいですか？"
        }
        description="この操作は取り消しできません。"
        confirmText="削除"
        cancelText="キャンセル"
        confirmVariant="destructive"
        confirmDisabled={isTemplateSubmitting || isTaskSubmitting}
        onConfirm={() => {
          const current = pendingDelete;
          if (!current) return;
          setPendingDelete(null);
          if (current.kind === "template") {
            void handleTemplateDelete(current.id);
          } else {
            void handleTaskDelete(current.id);
          }
        }}
      />
      <h1 className="text-3xl font-bold">Routine Settings</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Morning Routine Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templateItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                テンプレートがありません
              </p>
            ) : (
              <div className="space-y-2">
                {templateItems.map((item) => {
                  const isEditing = editingTemplateId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 text-sm"
                    >
                      {isEditing ? (
                        <Input
                          value={editingTemplateTitle}
                          onChange={(e) =>
                            setEditingTemplateTitle(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleTemplateEditSave();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              handleTemplateEditCancel();
                            }
                          }}
                        />
                      ) : (
                        <span>{item.title}</span>
                      )}
                      <div className="ml-auto flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={handleTemplateEditSave}
                              disabled={isTemplateSubmitting}
                            >
                              保存
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleTemplateEditCancel}
                              disabled={isTemplateSubmitting}
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
                              onClick={() => handleTemplateEditStart(item)}
                              disabled={isTemplateSubmitting}
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
                                setPendingDelete({ kind: "template", id: item.id });
                              }}
                              disabled={isTemplateSubmitting}
                              aria-label="削除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={templateTitleDraft}
                onChange={(e) => setTemplateTitleDraft(e.target.value)}
                placeholder="テンプレートを追加"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTemplateCreate();
                  }
                }}
              />
              <Button
                onClick={handleTemplateCreate}
                disabled={isTemplateSubmitting}
              >
                追加
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Routine Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {routineTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ルーティンタスクがありません
              </p>
            ) : (
              <div className="space-y-2">
                {routineTasks.map((task) => {
                  const isEditing = editingTaskId === task.id;
                  return (
                    <div
                      key={task.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editingTaskTitle}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleTaskEditSave}
                              disabled={isTaskSubmitting}
                            >
                              保存
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleTaskEditCancel}
                              disabled={isTaskSubmitting}
                            >
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="font-medium">{task.title}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleTaskEditStart(task)}
                              disabled={isTaskSubmitting}
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
                                setPendingDelete({ kind: "task", id: task.id });
                              }}
                              disabled={isTaskSubmitting}
                              aria-label="削除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <Input
                value={taskTitleDraft}
                onChange={(e) => setTaskTitleDraft(e.target.value)}
                placeholder="Routine Tasksを追加"
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleTaskCreate();
                  }
                }}
              />
              <Button
                onClick={handleTaskCreate}
                disabled={isTaskSubmitting}
              >
                追加
              </Button>
            </div>
          </CardContent>
        </Card>
        <WorkScheduleTemplates />
      </div>
    </div>
  );
}

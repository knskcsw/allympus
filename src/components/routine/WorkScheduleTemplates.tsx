"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Plus, Trash2, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEEKDAYS, includesWeekday, toggleWeekdayMask } from "@/lib/weekdayMask";

type Project = {
  id: string;
  code: string;
  name: string;
  sortOrder?: number | null;
  wbsList: { id: string; name: string }[];
};

type WorkScheduleTemplateItem = {
  id: string;
  startTime: string;
  endTime: string;
  projectId: string | null;
  wbsId: string | null;
  description: string;
  project?: { code: string; name: string } | null;
  wbs?: { name: string } | null;
};

type WorkScheduleTemplate = {
  id: string;
  name: string;
  weekdayMask: number;
  items: WorkScheduleTemplateItem[];
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

export default function WorkScheduleTemplates() {
  const [templates, setTemplates] = useState<WorkScheduleTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "template"; id: string }
    | { kind: "item"; id: string }
    | null
  >(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  // New item form state
  const [addingItemToTemplate, setAddingItemToTemplate] = useState<string | null>(null);
  const [newItemStartTime, setNewItemStartTime] = useState("");
  const [newItemEndTime, setNewItemEndTime] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemProjectId, setNewItemProjectId] = useState<string>("");
  const [newItemWbsId, setNewItemWbsId] = useState<string>("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [templatesResponse, projectsResponse] = await Promise.all([
        fetch("/api/work-schedule-templates", { cache: "no-store" }),
        fetch("/api/projects", { cache: "no-store" }),
      ]);
      const [templatesData, projectsData] = await Promise.all([
        parseJsonResponse(templatesResponse),
        parseJsonResponse(projectsResponse),
      ]);
      setTemplates(templatesData || []);
      setProjects(projectsData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
      alert("データの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTemplate = async () => {
    const name = newTemplateName.trim();
    if (!name) return;

    try {
      const response = await fetch("/api/work-schedule-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await parseJsonResponse(response);
      setNewTemplateName("");
      fetchData();
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("テンプレートの作成に失敗しました");
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplateId) return;
    const name = editingTemplateName.trim();
    if (!name) return;

    try {
      const response = await fetch(`/api/work-schedule-templates/${editingTemplateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await parseJsonResponse(response);
      setEditingTemplateId(null);
      setEditingTemplateName("");
      fetchData();
    } catch (error) {
      console.error("Failed to update template:", error);
      alert("テンプレートの更新に失敗しました");
    }
  };

  const handleWeekdayMaskUpdate = async (templateId: string, nextMask: number) => {
    const prevTemplate = templates.find((t) => t.id === templateId);
    if (!prevTemplate) return;

    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, weekdayMask: nextMask } : t))
    );

    try {
      const response = await fetch(`/api/work-schedule-templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekdayMask: nextMask }),
      });
      await parseJsonResponse(response);
    } catch (error) {
      console.error("Failed to update weekdayMask:", error);
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === templateId ? { ...t, weekdayMask: prevTemplate.weekdayMask } : t
        )
      );
      alert("曜日設定の更新に失敗しました");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/work-schedule-templates/${id}`, {
        method: "DELETE",
      });
      await parseJsonResponse(response);
      fetchData();
    } catch (error) {
      console.error("Failed to delete template:", error);
      alert("テンプレートの削除に失敗しました");
    }
  };

  const handleAddItem = async (templateId: string) => {
    if (!newItemStartTime || !newItemEndTime || !newItemDescription.trim()) {
      alert("時刻と作業内容を入力してください");
      return;
    }

    try {
      const response = await fetch(`/api/work-schedule-templates/${templateId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: newItemStartTime,
          endTime: newItemEndTime,
          description: newItemDescription.trim(),
          projectId: newItemProjectId || null,
          wbsId: newItemWbsId || null,
        }),
      });
      await parseJsonResponse(response);
      setAddingItemToTemplate(null);
      setNewItemStartTime("");
      setNewItemEndTime("");
      setNewItemDescription("");
      setNewItemProjectId("");
      setNewItemWbsId("");
      fetchData();
    } catch (error) {
      console.error("Failed to add item:", error);
      alert("アイテムの追加に失敗しました");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/work-schedule-templates/items/${itemId}`, {
        method: "DELETE",
      });
      await parseJsonResponse(response);
      fetchData();
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("アイテムの削除に失敗しました");
    }
  };

  const toggleTemplateExpanded = (templateId: string) => {
    setExpandedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  const orderedProjects = [...projects].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  // Create project/WBS options like in DailyTimeEntryTable
  const projectWbsOptions: Array<{ value: string; label: string }> = [];
  for (const project of orderedProjects) {
    if (project.wbsList && project.wbsList.length > 0) {
      for (const wbs of project.wbsList) {
        projectWbsOptions.push({
          value: `${project.id}|||${wbs.id}`,
          label: `${project.code} / ${wbs.name}`,
        });
      }
    }
  }

  return (
    <Card>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={
          pendingDelete?.kind === "template"
            ? "このテンプレートを削除してもよろしいですか？"
            : "このアイテムを削除してもよろしいですか？"
        }
        description="この操作は取り消しできません。"
        confirmText="削除"
        cancelText="キャンセル"
        confirmVariant="destructive"
        onConfirm={() => {
          const current = pendingDelete;
          if (!current) return;
          setPendingDelete(null);
          if (current.kind === "template") {
            void handleDeleteTemplate(current.id);
          } else {
            void handleDeleteItem(current.id);
          }
        }}
      />
      <CardHeader
        className={`flex flex-row items-center justify-between cursor-pointer ${
          isOpen ? "" : "py-3"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className={isOpen ? "" : "text-base"}>
          Work Schedule Templates
        </CardTitle>
        <Button size="sm" variant="ghost" onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}>
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
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              テンプレートがありません
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => {
                const isExpanded = expandedTemplates.has(template.id);
                const isEditing = editingTemplateId === template.id;
                return (
                  <div key={template.id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {isEditing ? (
                        <>
                          <Input
                            value={editingTemplateName}
                            onChange={(e) => setEditingTemplateName(e.target.value)}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleUpdateTemplate}>
                            保存
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTemplateId(null);
                              setEditingTemplateName("");
                            }}
                          >
                            キャンセル
                          </Button>
                        </>
                      ) : (
                        <>
                          <span
                            className="flex-1 font-medium cursor-pointer hover:text-primary"
                            onClick={() => toggleTemplateExpanded(template.id)}
                          >
                            {template.name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingTemplateId(template.id);
                              setEditingTemplateName(template.name);
                            }}
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
                              setPendingDelete({ kind: "template", id: template.id });
                            }}
                            aria-label="削除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleTemplateExpanded(template.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="space-y-2 mt-3 pl-2 border-l-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            出勤時に自動適用:
                          </span>
                          {WEEKDAYS.map((weekday) => {
                            const selected = includesWeekday(
                              template.weekdayMask ?? 0,
                              weekday.bit
                            );
                            return (
                              <Button
                                key={weekday.key}
                                type="button"
                                size="sm"
                                variant={selected ? "default" : "outline"}
                                className="h-7 px-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const nextMask = toggleWeekdayMask(
                                    template.weekdayMask ?? 0,
                                    weekday.bit
                                  );
                                  void handleWeekdayMaskUpdate(template.id, nextMask);
                                }}
                              >
                                {weekday.label}
                              </Button>
                            );
                          })}
                        </div>

                        {template.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                          >
                            <span className="tabular-nums">{item.startTime}-{item.endTime}</span>
                            <span className="flex-1">{item.description}</span>
                            {item.project && (
                              <span className="text-xs text-muted-foreground">
                                {item.project.code}
                                {item.wbs && ` / ${item.wbs.name}`}
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPendingDelete({ kind: "item", id: item.id });
                              }}
                              aria-label="削除"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        {addingItemToTemplate === template.id ? (
                          <div className="p-2 bg-muted rounded">
                            <div className="flex gap-2 items-start">
                              <Input
                                value={newItemDescription}
                                onChange={(e) => setNewItemDescription(e.target.value)}
                                placeholder="タスク名"
                                className="flex-1"
                              />
                              <Select
                                value={newItemProjectId && newItemWbsId ? `${newItemProjectId}|||${newItemWbsId}` : "none"}
                                onValueChange={(value) => {
                                  if (value === "none") {
                                    setNewItemProjectId("");
                                    setNewItemWbsId("");
                                  } else {
                                    const [projectId, wbsId] = value.split("|||");
                                    setNewItemProjectId(projectId);
                                    setNewItemWbsId(wbsId);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Project / WBS" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">集計なし</SelectItem>
                                  {projectWbsOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="time"
                                value={newItemStartTime}
                                onChange={(e) => setNewItemStartTime(e.target.value)}
                                placeholder="Start"
                                className="w-32"
                              />
                              <Input
                                type="time"
                                value={newItemEndTime}
                                onChange={(e) => setNewItemEndTime(e.target.value)}
                                placeholder="End"
                                className="w-32"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleAddItem(template.id)}
                              >
                                Add
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setAddingItemToTemplate(null);
                                  setNewItemStartTime("");
                                  setNewItemEndTime("");
                                  setNewItemDescription("");
                                  setNewItemProjectId("");
                                  setNewItemWbsId("");
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddingItemToTemplate(template.id);
                              setNewItemDescription(template.name);
                            }}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            アイテム追加
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="新しいテンプレート名"
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateTemplate();
                }
              }}
            />
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-1" />
              テンプレート作成
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

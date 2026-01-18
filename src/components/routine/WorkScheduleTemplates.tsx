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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { WEEKDAYS, includesWeekday, toggleWeekdayMask } from "@/lib/weekdayMask";

type Project = {
  id: string;
  code: string;
  name: string;
  abbreviation?: string | null;
  sortOrder?: number | null;
  isActive?: boolean;
  isKadminActive?: boolean;
  wbsList: { id: string; name: string }[];
};

type WorkScheduleTemplateAllocation = {
  id: string;
  itemId: string;
  projectId: string;
  project?: { id: string; code: string; name: string; abbreviation: string | null };
  wbsId: string | null;
  wbs?: { id: string; name: string } | null;
  percentage: number;
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
  allocations?: WorkScheduleTemplateAllocation[];
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
  const [newItemAllocationMode, setNewItemAllocationMode] = useState(false);
  const [newItemAllocations, setNewItemAllocations] = useState<Array<{
    id: string;
    projectId: string;
    wbsId: string;
    percentage: number;
  }>>([]);

  // Edit item form state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemStartTime, setEditingItemStartTime] = useState("");
  const [editingItemEndTime, setEditingItemEndTime] = useState("");
  const [editingItemDescription, setEditingItemDescription] = useState("");
  const [editingItemProjectId, setEditingItemProjectId] = useState<string>("");
  const [editingItemWbsId, setEditingItemWbsId] = useState<string>("");
  const [editingItemAllocationMode, setEditingItemAllocationMode] = useState(false);
  const [editingItemAllocations, setEditingItemAllocations] = useState<Array<{
    id: string;
    projectId: string;
    wbsId: string;
    percentage: number;
  }>>([]);

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

  const addNewItemAllocation = () => {
    setNewItemAllocations([
      ...newItemAllocations,
      {
        id: `temp-${Date.now()}`,
        projectId: "",
        wbsId: "",
        percentage: 0,
      },
    ]);
  };

  const removeNewItemAllocation = (id: string) => {
    setNewItemAllocations(newItemAllocations.filter((a) => a.id !== id));
  };

  const updateNewItemAllocation = (
    id: string,
    updates: { projectId?: string; wbsId?: string; percentage?: number }
  ) => {
    setNewItemAllocations(
      newItemAllocations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      )
    );
  };

  const getNewItemTotalPercentage = () => {
    return newItemAllocations.reduce((sum, a) => sum + a.percentage, 0);
  };

  const handleAddItem = async (templateId: string) => {
    if (!newItemStartTime || !newItemEndTime || !newItemDescription.trim()) {
      alert("時刻と作業内容を入力してください");
      return;
    }

    // Validate allocation mode
    if (newItemAllocationMode) {
      if (newItemAllocations.length === 0) {
        alert("按分を1件以上追加してください");
        return;
      }

      const totalPercentage = getNewItemTotalPercentage();
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`按分率の合計は100%にしてください（現在: ${totalPercentage.toFixed(1)}%）`);
        return;
      }

      const hasEmptyProject = newItemAllocations.some((a) => !a.projectId);
      if (hasEmptyProject) {
        alert("全ての按分にプロジェクトを選択してください");
        return;
      }
    }

    try {
      const payload: any = {
        startTime: newItemStartTime,
        endTime: newItemEndTime,
        description: newItemDescription.trim(),
      };

      if (newItemAllocationMode) {
        payload.allocations = newItemAllocations.map((a) => ({
          projectId: a.projectId,
          wbsId: a.wbsId || null,
          percentage: a.percentage,
        }));
        payload.projectId = null;
        payload.wbsId = null;
      } else {
        payload.projectId = newItemProjectId || null;
        payload.wbsId = newItemWbsId || null;
        payload.allocations = [];
      }

      const response = await fetch(`/api/work-schedule-templates/${templateId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await parseJsonResponse(response);
      setAddingItemToTemplate(null);
      setNewItemStartTime("");
      setNewItemEndTime("");
      setNewItemDescription("");
      setNewItemProjectId("");
      setNewItemWbsId("");
      setNewItemAllocationMode(false);
      setNewItemAllocations([]);
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

  const addEditItemAllocation = () => {
    setEditingItemAllocations([
      ...editingItemAllocations,
      {
        id: `temp-${Date.now()}`,
        projectId: "",
        wbsId: "",
        percentage: 0,
      },
    ]);
  };

  const removeEditItemAllocation = (id: string) => {
    setEditingItemAllocations(editingItemAllocations.filter((a) => a.id !== id));
  };

  const updateEditItemAllocation = (
    id: string,
    updates: { projectId?: string; wbsId?: string; percentage?: number }
  ) => {
    setEditingItemAllocations(
      editingItemAllocations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      )
    );
  };

  const getEditItemTotalPercentage = () => {
    return editingItemAllocations.reduce((sum, a) => sum + a.percentage, 0);
  };

  const handleStartEditItem = (item: WorkScheduleTemplateItem) => {
    setEditingItemId(item.id);
    setEditingItemStartTime(item.startTime);
    setEditingItemEndTime(item.endTime);
    setEditingItemDescription(item.description);

    const hasAllocations = !!(item.allocations && item.allocations.length > 0);
    setEditingItemAllocationMode(hasAllocations);

    if (hasAllocations) {
      setEditingItemAllocations(
        item.allocations!.map((alloc) => ({
          id: alloc.id,
          projectId: alloc.projectId,
          wbsId: alloc.wbsId || "",
          percentage: alloc.percentage,
        }))
      );
      setEditingItemProjectId("");
      setEditingItemWbsId("");
    } else {
      setEditingItemProjectId(item.projectId || "");
      setEditingItemWbsId(item.wbsId || "");
      setEditingItemAllocations([]);
    }
  };

  const handleUpdateItem = async (itemId: string) => {
    if (!editingItemStartTime || !editingItemEndTime || !editingItemDescription.trim()) {
      alert("時刻と作業内容を入力してください");
      return;
    }

    // Validate allocation mode
    if (editingItemAllocationMode) {
      if (editingItemAllocations.length === 0) {
        alert("按分を1件以上追加してください");
        return;
      }

      const totalPercentage = getEditItemTotalPercentage();
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`按分率の合計は100%にしてください（現在: ${totalPercentage.toFixed(1)}%）`);
        return;
      }

      const hasEmptyProject = editingItemAllocations.some((a) => !a.projectId);
      if (hasEmptyProject) {
        alert("全ての按分にプロジェクトを選択してください");
        return;
      }
    }

    try {
      const payload: any = {
        startTime: editingItemStartTime,
        endTime: editingItemEndTime,
        description: editingItemDescription.trim(),
      };

      if (editingItemAllocationMode) {
        payload.allocations = editingItemAllocations.map((a) => ({
          projectId: a.projectId,
          wbsId: a.wbsId || null,
          percentage: a.percentage,
        }));
        payload.projectId = null;
        payload.wbsId = null;
      } else {
        payload.projectId = editingItemProjectId || null;
        payload.wbsId = editingItemWbsId || null;
        payload.allocations = [];
      }

      const response = await fetch(`/api/work-schedule-templates/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await parseJsonResponse(response);
      handleCancelEditItem();
      fetchData();
    } catch (error) {
      console.error("Failed to update item:", error);
      alert("アイテムの更新に失敗しました");
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemStartTime("");
    setEditingItemEndTime("");
    setEditingItemDescription("");
    setEditingItemProjectId("");
    setEditingItemWbsId("");
    setEditingItemAllocationMode(false);
    setEditingItemAllocations([]);
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

  // Filter only active projects
  const activeProjects = projects.filter((p) => p.isActive);

  const orderedProjects = [...activeProjects].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );

  // Create project/WBS options like in DailyTimeEntryTable
  const projectWbsOptions: Array<{ value: string; label: string }> = [];
  for (const project of orderedProjects) {
    if (project.wbsList && project.wbsList.length > 0) {
      for (const wbs of project.wbsList) {
        projectWbsOptions.push({
          value: `${project.id}|||${wbs.id}`,
          label: `${project.abbreviation || project.code}■${wbs.name}`,
        });
      }
    }
  }

  const getProjectSelectValue = (projectId: string, wbsId: string) => {
    if (!projectId) return "none";
    return wbsId ? `${projectId}|||${wbsId}` : `${projectId}|||`;
  };

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

                        {template.items.map((item) => {
                          const hasAllocations = item.allocations && item.allocations.length > 0;
                          const isEditing = editingItemId === item.id;

                          return (
                            <div key={item.id} className="space-y-1">
                              {isEditing ? (
                                <div className="p-3 bg-muted rounded space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      id={`edit-item-allocation-mode-${item.id}`}
                                      checked={editingItemAllocationMode}
                                      onCheckedChange={(checked) => {
                                        setEditingItemAllocationMode(checked);
                                        if (checked && editingItemAllocations.length === 0) {
                                          addEditItemAllocation();
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`edit-item-allocation-mode-${item.id}`} className="cursor-pointer text-sm">
                                      按分モード {editingItemAllocationMode && `(合計: ${getEditItemTotalPercentage().toFixed(1)}%)`}
                                    </Label>
                                    {editingItemAllocationMode && (
                                      <span
                                        className={
                                          Math.abs(getEditItemTotalPercentage() - 100) < 0.01
                                            ? "text-green-600 text-xs"
                                            : "text-destructive text-xs"
                                        }
                                      >
                                        {Math.abs(getEditItemTotalPercentage() - 100) < 0.01 ? "✓" : "⚠ 100%にしてください"}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex gap-2 items-start">
                                    <Input
                                      value={editingItemDescription}
                                      onChange={(e) => setEditingItemDescription(e.target.value)}
                                      placeholder="タスク名"
                                      className="flex-1"
                                    />
                                    <Input
                                      type="time"
                                      value={editingItemStartTime}
                                      onChange={(e) => setEditingItemStartTime(e.target.value)}
                                      placeholder="Start"
                                      className="w-32"
                                    />
                                    <Input
                                      type="time"
                                      value={editingItemEndTime}
                                      onChange={(e) => setEditingItemEndTime(e.target.value)}
                                      placeholder="End"
                                      className="w-32"
                                    />
                                  </div>

                                  {editingItemAllocationMode ? (
                                    <div className="space-y-2">
                                      {editingItemAllocations.map((alloc) => (
                                        <div key={alloc.id} className="flex gap-2 items-end border p-2 rounded">
                                          <div className="flex-1">
                                            <Select
                                              value={getProjectSelectValue(alloc.projectId, alloc.wbsId)}
                                              onValueChange={(value) => {
                                                if (value === "none") {
                                                  updateEditItemAllocation(alloc.id, {
                                                    projectId: "",
                                                    wbsId: "",
                                                  });
                                                } else {
                                                  const [projectId, wbsId = ""] = value.split("|||");
                                                  updateEditItemAllocation(alloc.id, {
                                                    projectId,
                                                    wbsId,
                                                  });
                                                }
                                              }}
                                            >
                                              <SelectTrigger className="h-8">
                                                <SelectValue placeholder="Project■WBS" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">選択してください</SelectItem>
                                                {projectWbsOptions.map((option) => (
                                                  <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="w-20">
                                            <Input
                                              type="number"
                                              min="0"
                                              max="100"
                                              step="0.1"
                                              value={alloc.percentage || ""}
                                              onChange={(e) =>
                                                updateEditItemAllocation(alloc.id, {
                                                  percentage: parseFloat(e.target.value) || 0,
                                                })
                                              }
                                              className="h-8"
                                              placeholder="%"
                                            />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => removeEditItemAllocation(alloc.id)}
                                            disabled={editingItemAllocations.length === 1}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addEditItemAllocation}
                                      >
                                        + 按分を追加
                                      </Button>
                                    </div>
                                  ) : (
                                    <Select
                                      value={editingItemProjectId && editingItemWbsId ? `${editingItemProjectId}|||${editingItemWbsId}` : "none"}
                                      onValueChange={(value) => {
                                        if (value === "none") {
                                          setEditingItemProjectId("");
                                          setEditingItemWbsId("");
                                        } else {
                                          const [projectId, wbsId] = value.split("|||");
                                          setEditingItemProjectId(projectId);
                                          setEditingItemWbsId(wbsId);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
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
                                  )}

                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateItem(item.id)}
                                    >
                                      保存
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleCancelEditItem}
                                    >
                                      キャンセル
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                                    <span className="tabular-nums">{item.startTime}-{item.endTime}</span>
                                    <span className="flex-1">{item.description}</span>
                                    {hasAllocations ? (
                                      <span className="text-xs text-muted-foreground">
                                        按分: {item.allocations!.length}件
                                      </span>
                                    ) : item.project ? (
                                      <span className="text-xs text-muted-foreground">
                                        {item.project.code}
                                        {item.wbs && `■${item.wbs.name}`}
                                      </span>
                                    ) : null}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleStartEditItem(item);
                                      }}
                                      aria-label="編集"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
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
                                  {hasAllocations && (
                                    <div className="pl-4 space-y-0.5">
                                      {item.allocations!.map((alloc) => (
                                        <div key={alloc.id} className="text-xs text-muted-foreground">
                                          ↳ {alloc.percentage.toFixed(1)}% {alloc.project?.abbreviation || alloc.project?.code}
                                          {alloc.wbs && `■${alloc.wbs.name}`}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}

                        {addingItemToTemplate === template.id ? (
                          <div className="p-3 bg-muted rounded space-y-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                id="new-item-allocation-mode"
                                checked={newItemAllocationMode}
                                onCheckedChange={(checked) => {
                                  setNewItemAllocationMode(checked);
                                  if (checked && newItemAllocations.length === 0) {
                                    addNewItemAllocation();
                                  }
                                }}
                              />
                              <Label htmlFor="new-item-allocation-mode" className="cursor-pointer text-sm">
                                按分モード {newItemAllocationMode && `(合計: ${getNewItemTotalPercentage().toFixed(1)}%)`}
                              </Label>
                              {newItemAllocationMode && (
                                <span
                                  className={
                                    Math.abs(getNewItemTotalPercentage() - 100) < 0.01
                                      ? "text-green-600 text-xs"
                                      : "text-destructive text-xs"
                                  }
                                >
                                  {Math.abs(getNewItemTotalPercentage() - 100) < 0.01 ? "✓" : "⚠ 100%にしてください"}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2 items-start">
                              <Input
                                value={newItemDescription}
                                onChange={(e) => setNewItemDescription(e.target.value)}
                                placeholder="タスク名"
                                className="flex-1"
                              />
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
                            </div>

                            {newItemAllocationMode ? (
                              <div className="space-y-2">
                                {newItemAllocations.map((alloc) => (
                                  <div key={alloc.id} className="flex gap-2 items-end border p-2 rounded">
                                    <div className="flex-1">
                                      <Select
                                        value={getProjectSelectValue(alloc.projectId, alloc.wbsId)}
                                        onValueChange={(value) => {
                                          if (value === "none") {
                                            updateNewItemAllocation(alloc.id, {
                                              projectId: "",
                                              wbsId: "",
                                            });
                                          } else {
                                            const [projectId, wbsId = ""] = value.split("|||");
                                            updateNewItemAllocation(alloc.id, {
                                              projectId,
                                              wbsId,
                                            });
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-8">
                                          <SelectValue placeholder="Project■WBS" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">選択してください</SelectItem>
                                          {projectWbsOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                              {option.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="w-20">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={alloc.percentage || ""}
                                        onChange={(e) =>
                                          updateNewItemAllocation(alloc.id, {
                                            percentage: parseFloat(e.target.value) || 0,
                                          })
                                        }
                                        className="h-8"
                                        placeholder="%"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => removeNewItemAllocation(alloc.id)}
                                      disabled={newItemAllocations.length === 1}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={addNewItemAllocation}
                                >
                                  + 按分を追加
                                </Button>
                              </div>
                            ) : (
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
                                <SelectTrigger className="w-full">
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
                            )}

                            <div className="flex gap-2">
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
                                  setNewItemAllocationMode(false);
                                  setNewItemAllocations([]);
                                }}
                              >
                                キャンセル
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

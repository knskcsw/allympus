"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Project = {
  id: string;
  code: string;
  name: string;
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
  const [isOpen, setIsOpen] = useState(false);
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
        fetch("/api/work-schedule-templates"),
        fetch("/api/projects"),
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

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("このテンプレートを削除してもよろしいですか？")) return;

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
    if (!confirm("このアイテムを削除してもよろしいですか？")) return;

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

  const selectedProject = projects.find((p) => p.id === newItemProjectId);

  return (
    <Card>
      <CardHeader
        className={`flex flex-row items-center justify-between cursor-pointer ${
          isOpen ? "" : "py-3"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className={isOpen ? "" : "text-base"}>
          稼働実績テンプレート
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
                          <span className="flex-1 font-medium">{template.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingTemplateId(template.id);
                              setEditingTemplateName(template.name);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
                        {template.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                          >
                            <span className="font-mono">{item.startTime}-{item.endTime}</span>
                            <span className="flex-1">{item.description}</span>
                            {item.project && (
                              <span className="text-xs text-muted-foreground">
                                {item.project.code}
                                {item.wbs && ` / ${item.wbs.name}`}
                              </span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}

                        {addingItemToTemplate === template.id ? (
                          <div className="space-y-2 p-2 bg-muted rounded">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="time"
                                value={newItemStartTime}
                                onChange={(e) => setNewItemStartTime(e.target.value)}
                                placeholder="開始時刻"
                              />
                              <Input
                                type="time"
                                value={newItemEndTime}
                                onChange={(e) => setNewItemEndTime(e.target.value)}
                                placeholder="終了時刻"
                              />
                            </div>
                            <Input
                              value={newItemDescription}
                              onChange={(e) => setNewItemDescription(e.target.value)}
                              placeholder="作業内容"
                            />
                            <Select
                              value={newItemProjectId}
                              onValueChange={(value) => {
                                setNewItemProjectId(value);
                                setNewItemWbsId("");
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="プロジェクト（任意）" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">なし</SelectItem>
                                {projects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.code} - {project.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {selectedProject && selectedProject.wbsList.length > 0 && (
                              <Select
                                value={newItemWbsId}
                                onValueChange={setNewItemWbsId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="WBS（任意）" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">なし</SelectItem>
                                  {selectedProject.wbsList.map((wbs) => (
                                    <SelectItem key={wbs.id} value={wbs.id}>
                                      {wbs.name}
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
                                追加
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
                                キャンセル
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAddingItemToTemplate(template.id)}
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

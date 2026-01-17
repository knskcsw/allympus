"use client";

import { useState, type CSSProperties, type Dispatch, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import type { Project, Wbs } from "@/generated/prisma/client";
import { WORK_TYPES, WORK_TYPE_LABELS, type WorkType } from "@/lib/workTypes";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ProjectWithWbs = Project & { wbsList: Wbs[] };

interface ProjectListProps {
  projects: ProjectWithWbs[];
  onAddWbs: (projectId: string, name: string) => void;
  onDeleteWbs: (wbsId: string) => void;
  onUpdateWbs: (wbsId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (
    projectId: string,
    code: string,
    name: string,
    abbreviation: string | undefined,
    workType: WorkType
  ) => void;
  onToggleActive: (projectId: string, isActive: boolean) => void;
  onToggleKadminActive: (projectId: string, isKadminActive: boolean) => void;
  onMoveProject: (projectId: string, direction: "up" | "down") => void;
}

type SortableProjectItemProps = {
  project: ProjectWithWbs;
  index: number;
  projects: ProjectWithWbs[];
  expandedProjects: Set<string>;
  editingProject: string | null;
  editingProjectData: {
    code: string;
    name: string;
    abbreviation: string;
    workType: WorkType;
  };
  editingWbs: string | null;
  editingWbsName: string;
  newWbsName: Record<string, string>;
  onAddWbs: (projectId: string, name: string) => void;
  onDeleteWbs: (wbsId: string) => void;
  onUpdateWbs: (wbsId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (
    projectId: string,
    code: string,
    name: string,
    abbreviation: string | undefined,
    workType: WorkType
  ) => void;
  onToggleActive: (projectId: string, isActive: boolean) => void;
  onToggleKadminActive: (projectId: string, isKadminActive: boolean) => void;
  onMoveProject: (projectId: string, direction: "up" | "down") => void;
  setExpandedProjects: Dispatch<SetStateAction<Set<string>>>;
  setNewWbsName: Dispatch<SetStateAction<Record<string, string>>>;
  setEditingWbs: Dispatch<SetStateAction<string | null>>;
  setEditingWbsName: Dispatch<SetStateAction<string>>;
  setEditingProject: Dispatch<SetStateAction<string | null>>;
  setEditingProjectData: Dispatch<
    SetStateAction<{
      code: string;
      name: string;
      abbreviation: string;
      workType: WorkType;
    }>
  >;
};

function getGroupKey(project: ProjectWithWbs) {
  return `${project.isActive ? "1" : "0"}-${project.isKadminActive ? "1" : "0"}`;
}

function SortableProjectItem({
  project,
  index,
  projects,
  expandedProjects,
  editingProject,
  editingProjectData,
  editingWbs,
  editingWbsName,
  newWbsName,
  onAddWbs,
  onDeleteWbs,
  onUpdateWbs,
  onDeleteProject,
  onUpdateProject,
  onToggleActive,
  onToggleKadminActive,
  onMoveProject,
  setExpandedProjects,
  setNewWbsName,
  setEditingWbs,
  setEditingWbsName,
  setEditingProject,
  setEditingProjectData,
}: SortableProjectItemProps) {
  const isExpanded = expandedProjects.has(project.id);
  const isEditing = editingProject === project.id;

  const canMoveUp =
    index > 0 && getGroupKey(projects[index - 1]) === getGroupKey(project);
  const canMoveDown =
    index < projects.length - 1 &&
    getGroupKey(projects[index + 1]) === getGroupKey(project);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: project.id,
      disabled: isEditing,
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const handleAddWbs = (projectId: string) => {
    const name = newWbsName[projectId]?.trim();
    if (name) {
      onAddWbs(projectId, name);
      setNewWbsName((prev) => ({ ...prev, [projectId]: "" }));
    }
  };

  const startEditWbs = (wbs: Wbs) => {
    setEditingWbs(wbs.id);
    setEditingWbsName(wbs.name);
  };

  const saveEditWbs = () => {
    if (editingWbs && editingWbsName.trim()) {
      onUpdateWbs(editingWbs, editingWbsName.trim());
      setEditingWbs(null);
      setEditingWbsName("");
    }
  };

  const startEditProject = (projectToEdit: ProjectWithWbs) => {
    setEditingProject(projectToEdit.id);
    setEditingProjectData({
      code: projectToEdit.code,
      name: projectToEdit.name,
      abbreviation: projectToEdit.abbreviation || "",
      workType: (projectToEdit.workType as WorkType) || "IN_PROGRESS",
    });
  };

  const saveEditProject = () => {
    if (editingProject && editingProjectData.code.trim() && editingProjectData.name.trim()) {
      onUpdateProject(
        editingProject,
        editingProjectData.code.trim(),
        editingProjectData.name.trim(),
        editingProjectData.abbreviation.trim() || undefined,
        editingProjectData.workType
      );
      setEditingProject(null);
      setEditingProjectData({
        code: "",
        name: "",
        abbreviation: "",
        workType: "IN_PROGRESS",
      });
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-70" : ""}>
      <Card key={project.id} className={project.isActive ? "" : "opacity-50 bg-muted/30"}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-8 w-8"
                onClick={() => toggleProject(project.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>

              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingProjectData.code}
                    onChange={(e) =>
                      setEditingProjectData((prev) => ({
                        ...prev,
                        code: e.target.value,
                      }))
                    }
                    className="w-32 h-8"
                    placeholder="Code"
                  />
                  <Input
                    value={editingProjectData.name}
                    onChange={(e) =>
                      setEditingProjectData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="flex-1 h-8"
                    placeholder="Name"
                  />
                  <Input
                    value={editingProjectData.abbreviation}
                    onChange={(e) =>
                      setEditingProjectData((prev) => ({
                        ...prev,
                        abbreviation: e.target.value,
                      }))
                    }
                    className="w-24 h-8"
                    placeholder="Abbr."
                  />
                  <Select
                    value={editingProjectData.workType}
                    onValueChange={(value) =>
                      setEditingProjectData((prev) => ({
                        ...prev,
                        workType: value as WorkType,
                      }))
                    }
                  >
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue placeholder="稼働タイプ" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8"
                    onClick={saveEditProject}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8"
                    onClick={() => setEditingProject(null)}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => toggleProject(project.id)}
                >
                  <Badge variant="outline" className="font-mono">
                    {project.code}
                  </Badge>
                  {project.abbreviation && (
                    <Badge variant="secondary" className="text-xs">
                      {project.abbreviation}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {WORK_TYPE_LABELS[project.workType as WorkType] || "仕掛稼働"}
                  </Badge>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    ({project.wbsList.length} WBS)
                  </span>
                </div>
              )}
            </div>

            {!isEditing && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8 cursor-grab active:cursor-grabbing touch-none"
                    aria-label="Drag to reorder"
                    {...attributes}
                    {...listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8"
                    onClick={() => onMoveProject(project.id, "up")}
                    disabled={!canMoveUp}
                    aria-label="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8"
                    onClick={() => onMoveProject(project.id, "down")}
                    disabled={!canMoveDown}
                    aria-label="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={project.isActive}
                    onCheckedChange={(checked) => onToggleActive(project.id, checked)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {project.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={project.isKadminActive}
                    onCheckedChange={(checked) =>
                      onToggleKadminActive(project.id, checked)
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {project.isKadminActive ? "Kadmin Active" : "Kadmin Inactive"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-8 w-8"
                  onClick={() => startEditProject(project)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-8 w-8 text-destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this project?")) {
                      onDeleteProject(project.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                WBS Items
              </div>

              {project.wbsList.length === 0 ? (
                <div className="text-sm text-muted-foreground py-2">
                  No WBS items yet
                </div>
              ) : (
                <div className="space-y-1">
                  {project.wbsList.map((wbs) => (
                    <div
                      key={wbs.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted"
                    >
                      {editingWbs === wbs.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editingWbsName}
                            onChange={(e) => setEditingWbsName(e.target.value)}
                            className="flex-1 h-8"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditWbs();
                              if (e.key === "Escape") setEditingWbs(null);
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8"
                            onClick={saveEditWbs}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-8 w-8"
                            onClick={() => setEditingWbs(null)}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm">{wbs.name}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6"
                              onClick={() => startEditWbs(wbs)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6 text-destructive"
                              onClick={() => {
                                if (
                                  confirm("Are you sure you want to delete this WBS?")
                                ) {
                                  onDeleteWbs(wbs.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <Input
                  value={newWbsName[project.id] || ""}
                  onChange={(e) =>
                    setNewWbsName((prev) => ({
                      ...prev,
                      [project.id]: e.target.value,
                    }))
                  }
                  placeholder="New WBS name"
                  className="flex-1 h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddWbs(project.id);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddWbs(project.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add WBS
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function ProjectList({
  projects,
  onAddWbs,
  onDeleteWbs,
  onUpdateWbs,
  onDeleteProject,
  onUpdateProject,
  onToggleActive,
  onToggleKadminActive,
  onMoveProject,
}: ProjectListProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const [newWbsName, setNewWbsName] = useState<Record<string, string>>({});
  const [editingWbs, setEditingWbs] = useState<string | null>(null);
  const [editingWbsName, setEditingWbsName] = useState("");
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingProjectData, setEditingProjectData] = useState({
    code: "",
    name: "",
    abbreviation: "",
    workType: "IN_PROGRESS" as WorkType,
  });

  return (
    <div className="space-y-4">
      <SortableContext
        items={projects.map((project) => project.id)}
        strategy={verticalListSortingStrategy}
      >
        {projects.map((project, index) => (
          <SortableProjectItem
            key={project.id}
            project={project}
            index={index}
            projects={projects}
            expandedProjects={expandedProjects}
            editingProject={editingProject}
            editingProjectData={editingProjectData}
            editingWbs={editingWbs}
            editingWbsName={editingWbsName}
            newWbsName={newWbsName}
            onAddWbs={onAddWbs}
            onDeleteWbs={onDeleteWbs}
            onUpdateWbs={onUpdateWbs}
            onDeleteProject={onDeleteProject}
            onUpdateProject={onUpdateProject}
            onToggleActive={onToggleActive}
            onToggleKadminActive={onToggleKadminActive}
            onMoveProject={onMoveProject}
            setExpandedProjects={setExpandedProjects}
            setNewWbsName={setNewWbsName}
            setEditingWbs={setEditingWbs}
            setEditingWbsName={setEditingWbsName}
            setEditingProject={setEditingProject}
            setEditingProjectData={setEditingProjectData}
          />
        ))}
      </SortableContext>
    </div>
  );
}

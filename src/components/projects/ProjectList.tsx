"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
} from "lucide-react";
import type { Project, Wbs } from "@/generated/prisma/client";

type ProjectWithWbs = Project & { wbsList: Wbs[] };

interface ProjectListProps {
  projects: ProjectWithWbs[];
  onAddWbs: (projectId: string, name: string) => void;
  onDeleteWbs: (wbsId: string) => void;
  onUpdateWbs: (wbsId: string, name: string) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, code: string, name: string, abbreviation?: string) => void;
}

export function ProjectList({
  projects,
  onAddWbs,
  onDeleteWbs,
  onUpdateWbs,
  onDeleteProject,
  onUpdateProject,
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
  });

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
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

  const startEditProject = (project: ProjectWithWbs) => {
    setEditingProject(project.id);
    setEditingProjectData({
      code: project.code,
      name: project.name,
      abbreviation: project.abbreviation || ""
    });
  };

  const saveEditProject = () => {
    if (
      editingProject &&
      editingProjectData.code.trim() &&
      editingProjectData.name.trim()
    ) {
      onUpdateProject(
        editingProject,
        editingProjectData.code.trim(),
        editingProjectData.name.trim(),
        editingProjectData.abbreviation.trim() || undefined
      );
      setEditingProject(null);
      setEditingProjectData({ code: "", name: "", abbreviation: "" });
    }
  };

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const isExpanded = expandedProjects.has(project.id);
        const isEditing = editingProject === project.id;

        return (
          <Card key={project.id}>
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
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        ({project.wbsList.length} WBS)
                      </span>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1">
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
                        if (
                          confirm(
                            "Are you sure you want to delete this project?"
                          )
                        ) {
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
                                onChange={(e) =>
                                  setEditingWbsName(e.target.value)
                                }
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
                                      confirm(
                                        "Are you sure you want to delete this WBS?"
                                      )
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
        );
      })}
    </div>
  );
}

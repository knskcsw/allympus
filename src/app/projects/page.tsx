"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectImportDialog } from "@/components/projects/ProjectImportDialog";
import { Plus, FolderKanban, Upload } from "lucide-react";
import type { Project, Wbs } from "@/generated/prisma/client";
import type { WorkType } from "@/lib/workTypes";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

type ProjectWithWbs = Project & { wbsList: Wbs[] };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithWbs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    const response = await fetch("/api/projects?includeInactive=true");
    const data = await response.json();
    setProjects(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (data: {
    code: string;
    name: string;
    abbreviation?: string;
    workType: WorkType;
    wbsList: { name: string }[];
  }) => {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchProjects();
  };

  const handleAddWbs = async (projectId: string, name: string) => {
    await fetch(`/api/projects/${projectId}/wbs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchProjects();
  };

  const handleDeleteWbs = async (wbsId: string) => {
    await fetch(`/api/wbs/${wbsId}`, {
      method: "DELETE",
    });
    fetchProjects();
  };

  const handleUpdateWbs = async (wbsId: string, name: string) => {
    await fetch(`/api/wbs/${wbsId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    fetchProjects();
  };

  const handleDeleteProject = async (projectId: string) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    fetchProjects();
  };

  const handleUpdateProject = async (
    projectId: string,
    code: string,
    name: string,
    abbreviation: string | undefined,
    workType: WorkType
  ) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, abbreviation, workType }),
    });
    fetchProjects();
  };

  const handleToggleActive = async (projectId: string, isActive: boolean) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    fetchProjects();
  };

  const handleToggleKadminActive = async (
    projectId: string,
    isKadminActive: boolean
  ) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isKadminActive }),
    });
    fetchProjects();
  };

  const updateProjectOrder = useCallback(
    async (projectIds: string[]) => {
      await fetch("/api/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds }),
      });
      fetchProjects();
    },
    [fetchProjects]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getGroupKey = (project: ProjectWithWbs) =>
    `${project.isActive ? "1" : "0"}-${project.isKadminActive ? "1" : "0"}`;

  const handleMoveProject = useCallback(
    (projectId: string, direction: "up" | "down") => {
      setProjects((prev) => {
        const next = [...prev];
        const currentIndex = next.findIndex((project) => project.id === projectId);
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= next.length) {
          return prev;
        }
        if (getGroupKey(next[currentIndex]) !== getGroupKey(next[targetIndex])) {
          return prev;
        }
        [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
        void updateProjectOrder(next.map((project) => project.id));
        return next;
      });
    },
    [updateProjectOrder]
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over) return;
      if (active.id === over.id) return;

      setProjects((prev) => {
        const fromIndex = prev.findIndex((project) => project.id === active.id);
        const toIndex = prev.findIndex((project) => project.id === over.id);
        if (fromIndex < 0 || toIndex < 0) return prev;
        if (getGroupKey(prev[fromIndex]) !== getGroupKey(prev[toIndex])) return prev;

        const next = arrayMove(prev, fromIndex, toIndex);
        void updateProjectOrder(next.map((project) => project.id));
        return next;
      });
    },
    [updateProjectOrder]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <FolderKanban className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            CSV Import
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <FolderKanban className="h-12 w-12 mb-4" />
          <p className="text-lg">No projects yet</p>
          <p className="text-sm">Create your first project to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <ProjectList
            projects={projects}
            onAddWbs={handleAddWbs}
            onDeleteWbs={handleDeleteWbs}
            onUpdateWbs={handleUpdateWbs}
            onDeleteProject={handleDeleteProject}
            onUpdateProject={handleUpdateProject}
            onToggleActive={handleToggleActive}
            onToggleKadminActive={handleToggleKadminActive}
            onMoveProject={handleMoveProject}
          />
        </DndContext>
      )}

      <ProjectForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />

      <ProjectImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onComplete={fetchProjects}
      />
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Plus, FolderKanban } from "lucide-react";
import type { Project, Wbs } from "@/generated/prisma/client";

type ProjectWithWbs = Project & { wbsList: Wbs[] };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithWbs[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    const response = await fetch("/api/projects");
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
    abbreviation?: string
  ) => {
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, abbreviation }),
    });
    fetchProjects();
  };

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
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <FolderKanban className="h-12 w-12 mb-4" />
          <p className="text-lg">No projects yet</p>
          <p className="text-sm">Create your first project to get started</p>
        </div>
      ) : (
        <ProjectList
          projects={projects}
          onAddWbs={handleAddWbs}
          onDeleteWbs={handleDeleteWbs}
          onUpdateWbs={handleUpdateWbs}
          onDeleteProject={handleDeleteProject}
          onUpdateProject={handleUpdateProject}
        />
      )}

      <ProjectForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}

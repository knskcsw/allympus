"use client";

import { useCallback, useState, useMemo } from "react";
import type { ProjectWithWbs, CreateProjectData, UpdateProjectData } from "@/types";

// API response type
interface ApiResponse<T = void> {
  data?: T;
  error?: string;
}

// Generic API request helper
async function apiRequest<T = void>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) {
      return { error: `Request failed: ${response.statusText}` };
    }
    // Some endpoints return empty response
    const text = await response.text();
    if (text) {
      return { data: JSON.parse(text) };
    }
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithWbs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    const { data } = await apiRequest<ProjectWithWbs[]>(
      "/api/projects?includeInactive=true"
    );
    if (data) {
      setProjects(data);
    }
    setIsLoading(false);
  }, []);

  // Create a new project
  const createProject = useCallback(
    async (data: CreateProjectData) => {
      await apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Update a project
  const updateProject = useCallback(
    async (projectId: string, data: UpdateProjectData) => {
      await apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Delete a project
  const deleteProject = useCallback(
    async (projectId: string) => {
      await apiRequest(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Toggle project active status
  const toggleActive = useCallback(
    async (projectId: string, isActive: boolean) => {
      await apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Toggle Kadmin active status
  const toggleKadminActive = useCallback(
    async (projectId: string, isKadminActive: boolean) => {
      await apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ isKadminActive }),
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Reorder projects
  const reorderProjects = useCallback(
    async (projectIds: string[]) => {
      await apiRequest("/api/projects/reorder", {
        method: "POST",
        body: JSON.stringify({ projectIds }),
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Add WBS to project
  const addWbs = useCallback(
    async (projectId: string, name: string) => {
      await apiRequest(`/api/projects/${projectId}/wbs`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Update WBS
  const updateWbs = useCallback(
    async (wbsId: string, name: string) => {
      await apiRequest(`/api/wbs/${wbsId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Delete WBS
  const deleteWbs = useCallback(
    async (wbsId: string) => {
      await apiRequest(`/api/wbs/${wbsId}`, {
        method: "DELETE",
      });
      await fetchProjects();
    },
    [fetchProjects]
  );

  // Optimistic update for project order (for drag and drop)
  const setProjectsOptimistic = useCallback(
    (updater: (prev: ProjectWithWbs[]) => ProjectWithWbs[]) => {
      setProjects(updater);
    },
    []
  );

  return useMemo(
    () => ({
      projects,
      isLoading,
      fetchProjects,
      createProject,
      updateProject,
      deleteProject,
      toggleActive,
      toggleKadminActive,
      reorderProjects,
      addWbs,
      updateWbs,
      deleteWbs,
      setProjectsOptimistic,
    }),
    [
      projects,
      isLoading,
      fetchProjects,
      createProject,
      updateProject,
      deleteProject,
      toggleActive,
      toggleKadminActive,
      reorderProjects,
      addWbs,
      updateWbs,
      deleteWbs,
      setProjectsOptimistic,
    ]
  );
}

// Helper function to determine project group for drag constraints
export function getProjectGroupKey(project: ProjectWithWbs): string {
  return `${project.isActive ? "1" : "0"}-${project.isKadminActive ? "1" : "0"}`;
}

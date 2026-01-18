"use client";

import { useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectImportDialog } from "@/components/projects/ProjectImportDialog";
import { Plus, FolderKanban, Upload } from "lucide-react";
import { useProjects, getProjectGroupKey } from "@/hooks/useProjects";
import { useDialogState } from "@/hooks/useDialogState";
import type { CreateProjectData, UpdateProjectData } from "@/types";
import type { WorkType } from "@/lib/workTypes";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// DnD sensor configuration (stable reference)
const POINTER_SENSOR_CONFIG = { activationConstraint: { distance: 8 } };
const TOUCH_SENSOR_CONFIG = {
  activationConstraint: { delay: 150, tolerance: 5 },
};
const KEYBOARD_SENSOR_CONFIG = {
  coordinateGetter: sortableKeyboardCoordinates,
};

// DnD modifiers (stable reference)
const DND_MODIFIERS = [restrictToVerticalAxis, restrictToParentElement];

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
      <FolderKanban className="h-12 w-12 mb-4" />
      <p className="text-lg">No projects yet</p>
      <p className="text-sm">Create your first project to get started</p>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">Loading...</div>
  );
}

// Page header component
interface PageHeaderProps {
  onOpenForm: () => void;
  onOpenImport: () => void;
}

function PageHeader({ onOpenForm, onOpenImport }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <FolderKanban className="h-5 w-5" />
        </div>
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onOpenImport} variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          CSV Import
        </Button>
        <Button onClick={onOpenForm}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const {
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
  } = useProjects();

  const [isFormOpen, openForm, closeForm] = useDialogState(false);
  const [isImportDialogOpen, openImportDialog, closeImportDialog] =
    useDialogState(false);

  // Initial data fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handlers
  const handleCreate = useCallback(
    async (data: CreateProjectData) => {
      await createProject(data);
    },
    [createProject]
  );

  const handleUpdateProject = useCallback(
    async (
      projectId: string,
      code: string,
      name: string,
      abbreviation: string | undefined,
      workType: WorkType
    ) => {
      const data: UpdateProjectData = { code, name, abbreviation, workType };
      await updateProject(projectId, data);
    },
    [updateProject]
  );

  const handleMoveProject = useCallback(
    (projectId: string, direction: "up" | "down") => {
      setProjectsOptimistic((prev) => {
        const next = [...prev];
        const currentIndex = next.findIndex((p) => p.id === projectId);
        const targetIndex =
          direction === "up" ? currentIndex - 1 : currentIndex + 1;

        // Boundary check
        if (
          currentIndex < 0 ||
          targetIndex < 0 ||
          targetIndex >= next.length
        ) {
          return prev;
        }

        // Group constraint check
        if (
          getProjectGroupKey(next[currentIndex]) !==
          getProjectGroupKey(next[targetIndex])
        ) {
          return prev;
        }

        // Swap positions
        [next[currentIndex], next[targetIndex]] = [
          next[targetIndex],
          next[currentIndex],
        ];

        // Persist order to server
        void reorderProjects(next.map((p) => p.id));

        return next;
      });
    },
    [setProjectsOptimistic, reorderProjects]
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;

      setProjectsOptimistic((prev) => {
        const fromIndex = prev.findIndex((p) => p.id === active.id);
        const toIndex = prev.findIndex((p) => p.id === over.id);

        // Validate indices
        if (fromIndex < 0 || toIndex < 0) return prev;

        // Group constraint check
        if (
          getProjectGroupKey(prev[fromIndex]) !==
          getProjectGroupKey(prev[toIndex])
        ) {
          return prev;
        }

        const next = arrayMove(prev, fromIndex, toIndex);

        // Persist order to server
        void reorderProjects(next.map((p) => p.id));

        return next;
      });
    },
    [setProjectsOptimistic, reorderProjects]
  );

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, POINTER_SENSOR_CONFIG),
    useSensor(TouchSensor, TOUCH_SENSOR_CONFIG),
    useSensor(KeyboardSensor, KEYBOARD_SENSOR_CONFIG)
  );

  // Memoized project list handlers object
  const projectListHandlers = useMemo(
    () => ({
      onAddWbs: addWbs,
      onDeleteWbs: deleteWbs,
      onUpdateWbs: updateWbs,
      onDeleteProject: deleteProject,
      onUpdateProject: handleUpdateProject,
      onToggleActive: toggleActive,
      onToggleKadminActive: toggleKadminActive,
      onMoveProject: handleMoveProject,
    }),
    [
      addWbs,
      deleteWbs,
      updateWbs,
      deleteProject,
      handleUpdateProject,
      toggleActive,
      toggleKadminActive,
      handleMoveProject,
    ]
  );

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <PageHeader onOpenForm={openForm} onOpenImport={openImportDialog} />

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={DND_MODIFIERS}
          onDragEnd={handleDragEnd}
        >
          <ProjectList projects={projects} {...projectListHandlers} />
        </DndContext>
      )}

      <ProjectForm
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={handleCreate}
      />

      <ProjectImportDialog
        open={isImportDialogOpen}
        onOpenChange={closeImportDialog}
        onComplete={fetchProjects}
      />
    </div>
  );
}

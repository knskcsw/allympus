"use client";

import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import type { MorningRoutineItem, DailyData } from "@/types/daily";

interface UseMorningRoutineReturn {
  // State
  routineItems: MorningRoutineItem[];
  isRoutineComplete: boolean;
  isRoutineOpen: boolean;
  setIsRoutineOpen: (open: boolean) => void;

  // Draft state for new item
  routineTitleDraft: string;
  setRoutineTitleDraft: (title: string) => void;

  // Edit state
  editingRoutineId: string | null;
  editingRoutineTitle: string;
  setEditingRoutineTitle: (title: string) => void;

  // Note edit state
  editingNoteId: string | null;
  editingNoteContent: string;
  setEditingNoteContent: (content: string) => void;

  // Loading state
  isRoutineSubmitting: boolean;
  isRoutineImporting: boolean;

  // Actions
  handleRoutineToggle: (id: string, completed: boolean) => Promise<void>;
  handleRoutineCreate: () => Promise<void>;
  handleRoutineImport: () => Promise<void>;
  handleRoutineEditStart: (id: string, title: string) => void;
  handleRoutineEditCancel: () => void;
  handleRoutineEditSave: (id: string) => Promise<void>;
  handleRoutineDelete: (id: string) => Promise<void>;
  handleNoteEditStart: (id: string, note: string | null | undefined) => void;
  handleNoteEditCancel: () => void;
  handleNoteEditSave: (id: string) => Promise<void>;
  resetEditState: () => void;
}

interface UseMorningRoutineProps {
  selectedDate: Date;
  data: DailyData | null;
  setData: React.Dispatch<React.SetStateAction<DailyData | null>>;
  onDataRefresh: () => Promise<void>;
}

export function useMorningRoutine({
  selectedDate,
  data,
  setData,
  onDataRefresh,
}: UseMorningRoutineProps): UseMorningRoutineReturn {
  const [routineTitleDraft, setRoutineTitleDraft] = useState("");
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingRoutineTitle, setEditingRoutineTitle] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isRoutineSubmitting, setIsRoutineSubmitting] = useState(false);
  const [isRoutineImporting, setIsRoutineImporting] = useState(false);
  const [isRoutineOpen, setIsRoutineOpen] = useState(true);

  const routineItems = data?.morningRoutine || [];
  const isRoutineComplete =
    routineItems.length > 0 && routineItems.every((item) => item.completed);

  // Auto-collapse when routine is complete
  useEffect(() => {
    setIsRoutineOpen(!isRoutineComplete);
  }, [isRoutineComplete]);

  // Reset edit state when date changes
  const resetEditState = useCallback(() => {
    setEditingRoutineId(null);
    setEditingRoutineTitle("");
    setRoutineTitleDraft("");
    setEditingNoteId(null);
    setEditingNoteContent("");
  }, []);

  useEffect(() => {
    resetEditState();
  }, [selectedDate, resetEditState]);

  const handleRoutineToggle = useCallback(
    async (id: string, completed: boolean) => {
      // Optimistic update
      setData((prevData) => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          morningRoutine: prevData.morningRoutine.map((item) =>
            item.id === id ? { ...item, completed } : item
          ),
        };
      });

      try {
        const response = await fetch(`/api/morning-routine/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed }),
        });

        if (!response.ok) {
          // Rollback on failure
          onDataRefresh();
        }
      } catch (error) {
        console.error("Failed to update routine item:", error);
        // Rollback on error
        onDataRefresh();
      }
    },
    [setData, onDataRefresh]
  );

  const handleRoutineCreate = useCallback(async () => {
    const title = routineTitleDraft.trim();
    if (!title) return;

    setIsRoutineSubmitting(true);
    try {
      const response = await fetch("/api/morning-routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: selectedDate.toISOString(),
        }),
      });

      if (response.ok) {
        setRoutineTitleDraft("");
        onDataRefresh();
      }
    } catch (error) {
      console.error("Failed to create routine item:", error);
    } finally {
      setIsRoutineSubmitting(false);
    }
  }, [routineTitleDraft, selectedDate, onDataRefresh]);

  const handleRoutineImport = useCallback(async () => {
    if (isRoutineImporting) return;

    const hasExisting = routineItems.length > 0;
    setIsRoutineImporting(true);

    try {
      const response = await fetch("/api/morning-routine/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          overwrite: hasExisting,
        }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        let message = responseText;
        try {
          message = JSON.parse(responseText).error || responseText;
        } catch {
          // Fallback to raw text
        }
        alert(message || "テンプレートの取り込みに失敗しました");
        return;
      }

      await onDataRefresh();
      setIsRoutineOpen(true);
    } catch (error) {
      console.error("Failed to import routine template:", error);
      alert("テンプレートの取り込みに失敗しました");
    } finally {
      setIsRoutineImporting(false);
    }
  }, [isRoutineImporting, routineItems.length, selectedDate, onDataRefresh]);

  const handleRoutineEditStart = useCallback((id: string, title: string) => {
    setEditingRoutineId(id);
    setEditingRoutineTitle(title);
  }, []);

  const handleRoutineEditCancel = useCallback(() => {
    setEditingRoutineId(null);
    setEditingRoutineTitle("");
  }, []);

  const handleRoutineEditSave = useCallback(
    async (id: string) => {
      const title = editingRoutineTitle.trim();
      if (!title) return;

      setIsRoutineSubmitting(true);
      try {
        const response = await fetch(`/api/morning-routine/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        if (response.ok) {
          handleRoutineEditCancel();
          onDataRefresh();
        }
      } catch (error) {
        console.error("Failed to update routine item:", error);
      } finally {
        setIsRoutineSubmitting(false);
      }
    },
    [editingRoutineTitle, handleRoutineEditCancel, onDataRefresh]
  );

  const handleRoutineDelete = useCallback(
    async (id: string) => {
      setIsRoutineSubmitting(true);
      try {
        const response = await fetch(`/api/morning-routine/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          if (editingRoutineId === id) {
            handleRoutineEditCancel();
          }
          if (editingNoteId === id) {
            setEditingNoteId(null);
            setEditingNoteContent("");
          }
          onDataRefresh();
        }
      } catch (error) {
        console.error("Failed to delete routine item:", error);
      } finally {
        setIsRoutineSubmitting(false);
      }
    },
    [editingRoutineId, editingNoteId, handleRoutineEditCancel, onDataRefresh]
  );

  const handleNoteEditStart = useCallback(
    (id: string, note: string | null | undefined) => {
      setEditingNoteId(id);
      setEditingNoteContent(note || "");
    },
    []
  );

  const handleNoteEditCancel = useCallback(() => {
    setEditingNoteId(null);
    setEditingNoteContent("");
  }, []);

  const handleNoteEditSave = useCallback(
    async (id: string) => {
      setIsRoutineSubmitting(true);
      try {
        const noteValue = editingNoteContent.trim() || null;
        const response = await fetch(`/api/morning-routine/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: noteValue }),
        });

        if (response.ok) {
          // Optimistic update
          setData((prevData) => {
            if (!prevData) return prevData;
            return {
              ...prevData,
              morningRoutine: prevData.morningRoutine.map((item) =>
                item.id === id ? { ...item, note: noteValue } : item
              ),
            };
          });
          handleNoteEditCancel();
        }
      } catch (error) {
        console.error("Failed to update note:", error);
      } finally {
        setIsRoutineSubmitting(false);
      }
    },
    [editingNoteContent, setData, handleNoteEditCancel]
  );

  return {
    routineItems,
    isRoutineComplete,
    isRoutineOpen,
    setIsRoutineOpen,
    routineTitleDraft,
    setRoutineTitleDraft,
    editingRoutineId,
    editingRoutineTitle,
    setEditingRoutineTitle,
    editingNoteId,
    editingNoteContent,
    setEditingNoteContent,
    isRoutineSubmitting,
    isRoutineImporting,
    handleRoutineToggle,
    handleRoutineCreate,
    handleRoutineImport,
    handleRoutineEditStart,
    handleRoutineEditCancel,
    handleRoutineEditSave,
    handleRoutineDelete,
    handleNoteEditStart,
    handleNoteEditCancel,
    handleNoteEditSave,
    resetEditState,
  };
}

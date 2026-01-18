import { useCallback, useState } from "react";
import { apiRequest } from "@/lib/api";

export type EditableItem = {
  id: string;
  title: string;
};

type UseEditableListOptions = {
  /** Base API endpoint (e.g., "/api/routine-tasks") */
  baseEndpoint: string;
  /** HTTP method for update (default: "PATCH") */
  updateMethod?: "PUT" | "PATCH";
  /** Callback to refresh data after mutation */
  onMutationSuccess: () => void;
  /** Error message for create failure */
  createErrorMessage?: string;
  /** Error message for update failure */
  updateErrorMessage?: string;
  /** Error message for delete failure */
  deleteErrorMessage?: string;
};

type UseEditableListReturn<T extends EditableItem> = {
  // Draft state for new item
  draft: string;
  setDraft: (value: string) => void;

  // Editing state
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (value: string) => void;

  // Loading state
  isSubmitting: boolean;

  // Actions
  handleCreate: () => Promise<void>;
  handleEditStart: (item: T) => void;
  handleEditCancel: () => void;
  handleEditSave: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
};

export function useEditableList<T extends EditableItem>(
  options: UseEditableListOptions
): UseEditableListReturn<T> {
  const {
    baseEndpoint,
    updateMethod = "PATCH",
    onMutationSuccess,
    createErrorMessage = "作成に失敗しました",
    updateErrorMessage = "更新に失敗しました",
    deleteErrorMessage = "削除に失敗しました",
  } = options;

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = useCallback(async () => {
    const title = draft.trim();
    if (!title) return;

    setIsSubmitting(true);
    try {
      await apiRequest(baseEndpoint, {
        method: "POST",
        body: { title },
      });
      setDraft("");
      onMutationSuccess();
    } catch (error) {
      console.error("Failed to create:", error);
      alert(createErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [draft, baseEndpoint, onMutationSuccess, createErrorMessage]);

  const handleEditStart = useCallback((item: T) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditingTitle("");
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingId) return;
    const title = editingTitle.trim();
    if (!title) return;

    setIsSubmitting(true);
    try {
      await apiRequest(`${baseEndpoint}/${editingId}`, {
        method: updateMethod,
        body: { title },
      });
      handleEditCancel();
      onMutationSuccess();
    } catch (error) {
      console.error("Failed to update:", error);
      alert(updateErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingId, editingTitle, baseEndpoint, updateMethod, handleEditCancel, onMutationSuccess, updateErrorMessage]);

  const handleDelete = useCallback(async (id: string) => {
    setIsSubmitting(true);
    try {
      await apiRequest(`${baseEndpoint}/${id}`, { method: "DELETE" });
      if (editingId === id) {
        handleEditCancel();
      }
      onMutationSuccess();
    } catch (error) {
      console.error("Failed to delete:", error);
      alert(deleteErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [baseEndpoint, editingId, handleEditCancel, onMutationSuccess, deleteErrorMessage]);

  return {
    draft,
    setDraft,
    editingId,
    editingTitle,
    setEditingTitle,
    isSubmitting,
    handleCreate,
    handleEditStart,
    handleEditCancel,
    handleEditSave,
    handleDelete,
  };
}

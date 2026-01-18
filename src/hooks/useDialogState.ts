"use client";

import { useState, useCallback, useMemo } from "react";

/**
 * Custom hook for managing dialog/modal open state
 * Returns a tuple of [isOpen, open, close] for cleaner API
 */
export function useDialogState(
  initialState = false
): [boolean, () => void, () => void] {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return useMemo(() => [isOpen, open, close], [isOpen, open, close]);
}

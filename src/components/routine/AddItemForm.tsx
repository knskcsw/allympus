"use client";

import { memo, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AddItemFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  placeholder?: string;
  buttonText?: string;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
};

export const AddItemForm = memo(function AddItemForm({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  placeholder = "新規追加",
  buttonText = "追加",
  direction = "horizontal",
}: AddItemFormProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const containerClass =
    direction === "horizontal"
      ? "flex flex-col gap-2 sm:flex-row"
      : "space-y-2";

  return (
    <div className={containerClass}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
      />
      <Button onClick={onSubmit} disabled={isSubmitting}>
        {buttonText}
      </Button>
    </div>
  );
});

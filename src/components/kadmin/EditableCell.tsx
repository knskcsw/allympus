"use client";

import { memo, useEffect, useRef } from "react";
import { parseNumber } from "./types";

interface EditableCellProps {
  value: number;
  onCommit: (value: number) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  className?: string;
  ariaLabel?: string;
}

export const EditableCell = memo(function EditableCell({
  value,
  onCommit,
  onPaste,
  className,
  ariaLabel,
}: EditableCellProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    ref.current.textContent = String(value);
  }, [value]);

  const handleBlur = () => {
    onCommit(parseNumber(ref.current?.textContent ?? ""));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      ref.current?.blur();
    }
  };

  return (
    <div
      ref={ref}
      role="textbox"
      aria-label={ariaLabel}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={onPaste}
      className={`min-h-[2rem] w-full whitespace-nowrap text-right tabular-nums outline-none ${className ?? ""}`}
    />
  );
});

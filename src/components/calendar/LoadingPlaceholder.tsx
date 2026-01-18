"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface LoadingPlaceholderProps {
  height?: string;
  message?: string;
}

export const LoadingPlaceholder = memo(function LoadingPlaceholder({
  height = "h-64",
  message = "Loading...",
}: LoadingPlaceholderProps) {
  return (
    <div className={cn("flex items-center justify-center", height)}>
      {message}
    </div>
  );
});

"use client";

import { type CSSProperties } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { GripVertical, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableNavItemProps {
  id: string;
  name: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed: boolean;
}

export function SortableNavItem({
  id,
  name,
  href,
  icon: Icon,
  isActive,
  isCollapsed,
}: SortableNavItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isCollapsed });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative",
        isDragging && "opacity-70 shadow-lg z-50 rounded-lg"
      )}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          isCollapsed && "justify-center"
        )}
        title={isCollapsed ? name : undefined}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1">{name}</span>
            <button
              type="button"
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none",
                "p-1 rounded hover:bg-muted-foreground/10",
                isActive && "hover:bg-primary-foreground/10"
              )}
              {...attributes}
              {...listeners}
              onClick={(e) => e.preventDefault()}
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </>
        )}
      </Link>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  Home,
  Calendar,
  BarChart3,
  FolderKanban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  CalendarRange,
  LineChart,
  GripVertical,
  MoonStar,
  Wallet,
  Repeat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SortableNavItem } from "./SortableNavItem";

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const DEFAULT_NAVIGATION: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Daily", href: "/daily", icon: CalendarDays },
  { name: "Routine", href: "/routine", icon: Repeat },
  { name: "Sleep", href: "/sleep", icon: MoonStar },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Kadmin", href: "/kadmin", icon: Briefcase },
  { name: "Holidays", href: "/holidays", icon: CalendarRange },
  { name: "Monthly", href: "/monthly", icon: Calendar },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "EVM", href: "/evm", icon: LineChart },
  { name: "Salary", href: "/salary", icon: Wallet },
];

const STORAGE_KEY_ORDER = "sidebar-order";

const MIN_WIDTH = 180;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256; // 64 * 4 = w-64

function OlympusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 20L10 6l4 6 4-4 6 12H2z" fill="currentColor" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [navigation, setNavigation] = useState<NavigationItem[]>(DEFAULT_NAVIGATION);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load collapsed state, width, and navigation order from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === "true");
    }

    const savedWidth = localStorage.getItem("sidebar-width");
    if (savedWidth !== null) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }

    // Load navigation order
    const savedOrder = localStorage.getItem(STORAGE_KEY_ORDER);
    if (savedOrder) {
      try {
        const orderHrefs: string[] = JSON.parse(savedOrder);
        // Reorder navigation based on saved order
        const orderedNav = orderHrefs
          .map((href) => DEFAULT_NAVIGATION.find((item) => item.href === href))
          .filter((item): item is NavigationItem => item !== undefined);

        // Add any new items that weren't in saved order to the end
        const newItems = DEFAULT_NAVIGATION.filter(
          (item) => !orderHrefs.includes(item.href)
        );

        setNavigation([...orderedNav, ...newItems]);
      } catch {
        // On parse error, use default
        setNavigation(DEFAULT_NAVIGATION);
      }
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));

    // Dispatch custom event to notify layout
    window.dispatchEvent(new CustomEvent("sidebar-toggle", {
      detail: { isCollapsed: newState, width: sidebarWidth }
    }));
  };

  // Handle resize start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
        localStorage.setItem("sidebar-width", String(newWidth));

        // Dispatch custom event to notify layout
        window.dispatchEvent(new CustomEvent("sidebar-toggle", {
          detail: { isCollapsed, width: newWidth }
        }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, isCollapsed]);

  // Handle drag end - reorder navigation and save to localStorage
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setNavigation((prev) => {
      const oldIndex = prev.findIndex((item) => item.href === active.id);
      const newIndex = prev.findIndex((item) => item.href === over.id);

      const newOrder = arrayMove(prev, oldIndex, newIndex);

      // Save to localStorage
      localStorage.setItem(
        STORAGE_KEY_ORDER,
        JSON.stringify(newOrder.map((item) => item.href))
      );

      return newOrder;
    });
  }, []);

  return (
    <aside
      ref={sidebarRef}
      className="fixed left-0 top-0 z-40 h-screen border-r bg-background"
      style={{
        width: isCollapsed ? "64px" : `${sidebarWidth}px`,
        transition: isResizing ? "none" : "width 0.3s",
      }}
    >
      <div className="flex h-16 items-center border-b px-3 justify-between">
        <Link href="/" className={cn(
          "flex items-center gap-2 font-semibold",
          isCollapsed && "justify-center w-full"
        )}>
          <OlympusIcon className="h-6 w-6 flex-shrink-0 text-foreground" />
          {!isCollapsed && <span>Allympus</span>}
        </Link>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center p-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebar}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <nav className="space-y-1 p-2">
          <SortableContext
            items={navigation.map((item) => item.href)}
            strategy={verticalListSortingStrategy}
          >
            {navigation.map((item) => (
              <SortableNavItem
                key={item.href}
                id={item.href}
                name={item.name}
                href={item.href}
                icon={item.icon}
                isActive={pathname === item.href}
                isCollapsed={isCollapsed}
              />
            ))}
          </SortableContext>
        </nav>
      </DndContext>

      {/* Resize handle */}
      {!isCollapsed && (
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 active:bg-primary group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
    </aside>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clock,
  CheckSquare,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Daily", href: "/daily", icon: CalendarDays },
  { name: "Routine", href: "/routine", icon: Repeat },
  { name: "Attendance", href: "/attendance", icon: Clock },
  { name: "Sleep", href: "/sleep", icon: MoonStar },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Kadmin", href: "/kadmin", icon: Briefcase },
  { name: "Holidays", href: "/holidays", icon: CalendarRange },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "EVM", href: "/evm", icon: LineChart },
  { name: "Salary", href: "/salary", icon: Wallet },
];

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
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load collapsed state and width from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed !== null) {
      setIsCollapsed(savedCollapsed === "true");
    }

    const savedWidth = localStorage.getItem("sidebar-width");
    if (savedWidth !== null) {
      setSidebarWidth(parseInt(savedWidth, 10));
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

      <nav className="space-y-1 p-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>

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

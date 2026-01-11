"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Clock,
  CheckSquare,
  Calendar,
  BarChart3,
  Timer,
  FolderKanban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Daily", href: "/daily", icon: CalendarDays },
  { name: "Attendance", href: "/attendance", icon: Clock },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", String(newState));

    // Dispatch custom event to notify layout
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: { isCollapsed: newState } }));
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-16 items-center border-b px-3 justify-between">
        <Link href="/" className={cn(
          "flex items-center gap-2 font-semibold",
          isCollapsed && "justify-center w-full"
        )}>
          <Timer className="h-6 w-6 flex-shrink-0" />
          {!isCollapsed && <span>WorkTracker</span>}
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
    </aside>
  );
}

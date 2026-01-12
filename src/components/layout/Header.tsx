"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  sidebarOffset: number;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Header({ sidebarOffset, theme, onToggleTheme }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6 transition-[left] duration-300"
      style={{ left: `${sidebarOffset}px` }}
    >
      <div>
        {currentTime && (
          <div className="text-sm text-muted-foreground">
            {format(currentTime, "yyyy/MM/dd (E)", { locale: ja })}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-2xl font-bold tabular-nums">
          {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onToggleTheme}
          title={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          aria-label={isDark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}

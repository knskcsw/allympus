"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export function Header() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="fixed left-64 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        {currentTime && (
          <div className="text-sm text-muted-foreground">
            {format(currentTime, "yyyy/MM/dd (E)", { locale: ja })}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tabular-nums">
        {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
      </div>
    </header>
  );
}

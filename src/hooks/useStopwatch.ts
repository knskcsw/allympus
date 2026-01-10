"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseStopwatchReturn {
  time: number;
  isRunning: boolean;
  start: (startTime?: Date) => void;
  pause: () => void;
  reset: () => void;
  setTime: (time: number) => void;
}

export function useStopwatch(initialTime = 0): UseStopwatchReturn {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const start = useCallback((startTime?: Date) => {
    if (startTime) {
      startTimeRef.current = startTime;
      const elapsed = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );
      setTime(elapsed);
    }
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    startTimeRef.current = null;
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return { time, isRunning, start, pause, reset, setTime };
}

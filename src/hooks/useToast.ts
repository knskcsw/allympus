import { useCallback, useEffect, useRef, useState } from "react";

interface UseToastReturn {
  message: string | null;
  showToast: (message: string, duration?: number) => void;
  hideToast: () => void;
}

export function useToast(defaultDuration = 3000): UseToastReturn {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    setMessage(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (newMessage: string, duration = defaultDuration) => {
      setMessage(newMessage);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setMessage(null);
        timeoutRef.current = null;
      }, duration);
    },
    [defaultDuration]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { message, showToast, hideToast };
}

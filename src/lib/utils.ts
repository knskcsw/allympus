import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format minutes as "Xh Ym" string
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

/**
 * Format seconds as "Xh Ym" string
 */
export function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Convert daily values array to cumulative values array
 */
export function toCumulative(values: number[]): number[] {
  return values.reduce<number[]>((acc, value) => {
    const prev = acc.length ? acc[acc.length - 1] : 0;
    acc.push(prev + value);
    return acc;
  }, []);
}

export type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: Array<{ key: WeekdayKey; label: string; bit: number }> = [
  { key: "mon", label: "月", bit: 1 << 0 },
  { key: "tue", label: "火", bit: 1 << 1 },
  { key: "wed", label: "水", bit: 1 << 2 },
  { key: "thu", label: "木", bit: 1 << 3 },
  { key: "fri", label: "金", bit: 1 << 4 },
  { key: "sat", label: "土", bit: 1 << 5 },
  { key: "sun", label: "日", bit: 1 << 6 },
];

export function weekdayMaskFromDate(date: Date): number {
  // JS: 0=Sun ... 6=Sat
  const day = date.getDay();
  switch (day) {
    case 1:
      return 1 << 0; // Mon
    case 2:
      return 1 << 1; // Tue
    case 3:
      return 1 << 2; // Wed
    case 4:
      return 1 << 3; // Thu
    case 5:
      return 1 << 4; // Fri
    case 6:
      return 1 << 5; // Sat
    case 0:
    default:
      return 1 << 6; // Sun
  }
}

export function toggleWeekdayMask(mask: number, bit: number): number {
  return mask ^ bit;
}

export function includesWeekday(mask: number, bit: number): boolean {
  return (mask & bit) !== 0;
}


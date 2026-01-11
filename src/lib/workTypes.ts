export const WORK_TYPES = [
  { value: "IN_PROGRESS", label: "仕掛稼働" },
  { value: "SE_TRANSFER", label: "SE振替" },
  { value: "INDIRECT", label: "間接稼働" },
] as const;

export type WorkType = (typeof WORK_TYPES)[number]["value"];

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  IN_PROGRESS: "仕掛稼働",
  SE_TRANSFER: "SE振替",
  INDIRECT: "間接稼働",
};

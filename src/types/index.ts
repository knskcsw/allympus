export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Priority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export interface AttendanceWithDuration {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  breakMinutes: number;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  workingMinutes: number | null;
}

/**
 * Type definitions for the Daily page
 */

// Base types from Prisma models (simplified for frontend use)
export interface Project {
  id: string;
  code: string;
  name: string;
  abbreviation?: string | null;
  sortOrder?: number | null;
  wbsList: Array<{ id: string; name: string }>;
}

export interface Wbs {
  id: string;
  projectId: string;
  name: string;
  wbsNo: string | null;
  wbsClass: string | null;
}

export interface Attendance {
  id: string;
  date: Date | string;
  clockIn: Date | string | null;
  clockOut: Date | string | null;
  breakMinutes: number;
  workMode: string | null;
  sleepHours: number | null;
  note: string | null;
}

export interface MorningRoutineItem {
  id: string;
  date: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface DailyTask {
  id: string;
  date: Date | string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  estimatedMinutes: number | null;
  sortOrder?: number;
  createdAt?: string;
  totalTimeSpent?: number;
}

export interface RoutineTask {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

export interface TimeEntry {
  id: string;
  dailyTaskId: string | null;
  routineTaskId: string | null;
  projectId: string | null;
  wbsId: string | null;
  startTime: Date | string;
  endTime: Date | string | null;
  duration: number | null;
  note: string | null;
  project?: { id: string; code: string; name: string; abbreviation: string | null } | null;
  wbs?: { id: string; name: string } | null;
  dailyTask?: { id: string; title: string } | null;
  routineTask?: { id: string; title: string } | null;
}

export interface WbsSummaryItem {
  projectId: string | null;
  projectName: string;
  projectAbbreviation: string | null;
  wbsId: string | null;
  wbsName: string;
  totalSeconds: number;
  totalHours: number;
  taskNames: string[];
}

export interface WorkScheduleTemplate {
  id: string;
  name: string;
  weekdayMask: number;
  sortOrder: number;
}

// API Response type
export interface DailyData {
  attendance: Attendance | null;
  morningRoutine: MorningRoutineItem[];
  dailyTasks: DailyTask[];
  routineTasks: RoutineTask[];
  timeEntries: TimeEntry[];
  wbsSummary: WbsSummaryItem[];
}

// Form/Handler types
export interface TaskCreateData {
  title: string;
  description?: string;
  priority?: string;
  estimatedMinutes?: number;
}

export interface TaskUpdateData {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  estimatedMinutes?: number;
}

export interface TimeEntryCreateData {
  startTime: string;
  endTime?: string;
  projectId?: string;
  wbsId?: string;
  dailyTaskId?: string;
  routineTaskId?: string;
  note?: string;
}

export interface TimeEntryUpdateData {
  startTime?: string;
  endTime?: string;
  projectId?: string;
  wbsId?: string;
  dailyTaskId?: string;
  routineTaskId?: string;
  note?: string;
}

export interface CheckInData {
  date: string;
  clockIn: string;
  workMode: string;
  sleepHours: number;
}

// Work mode options
export const WORK_MODES = ["Office", "Telework", "Out of Office"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

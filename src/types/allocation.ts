// Allocation types for multi-project time entry allocation

export interface AllocationEntry {
  id: string;
  timeEntryId: string;
  projectId: string;
  project?: {
    id: string;
    code: string;
    name: string;
    abbreviation: string | null;
  };
  wbsId: string | null;
  wbs?: {
    id: string;
    name: string;
  } | null;
  percentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AllocationInputItem {
  projectId: string;
  wbsId: string | null;
  percentage: number;
}

export interface TimeEntryWithAllocations {
  id: string;
  dailyTaskId: string | null;
  dailyTask?: {
    id: string;
    title: string;
  } | null;
  routineTaskId: string | null;
  routineTask?: {
    id: string;
    title: string;
  } | null;
  projectId: string | null;
  project?: {
    id: string;
    code: string;
    name: string;
    abbreviation: string | null;
  } | null;
  wbsId: string | null;
  wbs?: {
    id: string;
    name: string;
  } | null;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  note: string | null;
  allocations: AllocationEntry[];
}

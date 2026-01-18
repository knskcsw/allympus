import type { Holiday } from "@/generated/prisma/client";

export type ProjectTotals = {
  acHours: number;
  pvHours: number;
  fixedHours: number;
  estimatedHours: number;
};

export type ProjectSeries = {
  projectId: string;
  projectName: string;
  acSeries: number[];
  pvSeries: number[];
  totals: ProjectTotals;
};

export type EvmData = {
  period: { start: string; end: string };
  days: string[];
  projects: ProjectSeries[];
};

export type FixedTask = {
  id: string;
  date: string;
  title: string;
  estimatedMinutes: number;
  projectId: string;
  project?: { id: string; name: string };
};

export type ViewMode = "daily" | "cumulative" | "acpv";

export type ChartSeries = {
  label: string;
  color: string;
  data: number[];
};

export type { Holiday };

import "server-only";

import { startOfDay, endOfDay } from "date-fns";
import type { PrismaClient } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";

type PrismaTx = Prisma.TransactionClient;

type ImportResult = {
  applied: boolean;
  skipped: boolean;
  count: number;
  routineTaskUsed?: number;
};

function parseTimeValue(time: string): { hours: number; minutes: number } | null {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23) return null;
  if (minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

function buildDateTime(base: Date, time: string): Date | null {
  const parts = parseTimeValue(time);
  if (!parts) return null;
  const result = new Date(base);
  result.setHours(parts.hours, parts.minutes, 0, 0);
  return result;
}

async function ensureDailyTaskId(
  prisma: PrismaTx,
  date: Date,
  title: string,
  sortOrder: number
): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.dailyTask.findFirst({
    where: {
      title,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    select: { id: true },
  });

  if (existing) return { id: existing.id, created: false };

  try {
    const created = await prisma.dailyTask.create({
      data: {
        date: startOfDay(date),
        title,
        status: "TODO",
        priority: "MEDIUM",
        sortOrder,
      },
      select: { id: true },
    });
    return { id: created.id, created: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const found = await prisma.dailyTask.findFirst({
        where: {
          title,
          date: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        select: { id: true },
      });
      if (found) return { id: found.id, created: false };
    }
    throw error;
  }
}

export async function importWorkScheduleTemplateForDate(
  prisma: PrismaTx,
  templateId: string,
  date: Date,
  options?: { recordApplication?: boolean }
): Promise<ImportResult> {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const template = await prisma.workScheduleTemplate.findUnique({
    where: { id: templateId },
    include: {
      items: {
        include: {
          allocations: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!template) {
    throw new Error("Template not found");
  }

  if (template.items.length === 0) {
    throw new Error("Template has no items");
  }

  if (template.items.some((item) => !item.description?.trim())) {
    throw new Error("Template item description is required");
  }

  if (options?.recordApplication) {
    try {
      await prisma.workScheduleTemplateApplication.create({
        data: {
          templateId,
          date: dayStart,
        },
        select: { id: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return { applied: false, skipped: true, count: 0 };
      }
      throw error;
    }
  }

  const existingSortOrder = await prisma.dailyTask.aggregate({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    _max: { sortOrder: true },
  });
  let nextSortOrder = (existingSortOrder._max.sortOrder ?? -1) + 1;

  // Fetch all Routine Tasks to check for duplicates
  const routineTasks = await prisma.routineTask.findMany({
    select: { id: true, title: true },
  });
  const routineTaskMap = new Map(
    routineTasks.map((task) => [task.title, task.id])
  );

  const createdEntries = [];
  let routineTaskUsedCount = 0;

  for (const item of template.items) {
    const taskTitle = item.description.trim();
    const routineTaskId = routineTaskMap.get(taskTitle);

    const startTime = buildDateTime(dayStart, item.startTime);
    const endTimeRaw = buildDateTime(dayStart, item.endTime);

    if (!startTime || !endTimeRaw) {
      throw new Error("Invalid time format in template item");
    }

    const endTime = endTimeRaw.getTime() <= startTime.getTime()
      ? new Date(endTimeRaw.getTime() + 24 * 60 * 60 * 1000)
      : endTimeRaw;

    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    // Check if item has allocations
    const hasAllocations = item.allocations && item.allocations.length > 0;

    if (routineTaskId) {
      // Case A: Routine Task with the same name exists
      // - Do not create DailyTask
      // - Create TimeEntry linked to routineTaskId
      const timeEntry = await prisma.timeEntry.create({
        data: {
          routineTaskId,
          dailyTaskId: null,
          startTime,
          endTime,
          duration: durationSeconds,
          note: null,
          projectId: hasAllocations ? null : item.projectId,
          wbsId: hasAllocations ? null : item.wbsId,
          allocations: hasAllocations ? {
            create: item.allocations!.map((alloc) => ({
              projectId: alloc.projectId,
              wbsId: alloc.wbsId,
              percentage: alloc.percentage,
            })),
          } : undefined,
        },
        select: { id: true },
      });
      createdEntries.push(timeEntry);
      routineTaskUsedCount++;
    } else {
      // Case B: No Routine Task with the same name
      // - Create DailyTask + TimeEntry (same as current behavior)
      const { id: dailyTaskId, created } = await ensureDailyTaskId(
        prisma,
        dayStart,
        taskTitle,
        nextSortOrder
      );
      if (created) nextSortOrder += 1;

      const timeEntry = await prisma.timeEntry.create({
        data: {
          dailyTaskId,
          routineTaskId: null,
          startTime,
          endTime,
          duration: durationSeconds,
          note: null,
          projectId: hasAllocations ? null : item.projectId,
          wbsId: hasAllocations ? null : item.wbsId,
          allocations: hasAllocations ? {
            create: item.allocations!.map((alloc) => ({
              projectId: alloc.projectId,
              wbsId: alloc.wbsId,
              percentage: alloc.percentage,
            })),
          } : undefined,
        },
        select: { id: true },
      });
      createdEntries.push(timeEntry);
    }
  }

  return {
    applied: true,
    skipped: false,
    count: createdEntries.length,
    routineTaskUsed: routineTaskUsedCount
  };
}

export async function applyWeekdayWorkScheduleTemplatesOnCheckIn(
  prisma: PrismaClient,
  date: Date,
  weekdayBit: number
): Promise<{ templatesApplied: number; entriesCreated: number }> {
  const templates = await prisma.workScheduleTemplate.findMany({
    where: { weekdayMask: { not: 0 } },
    select: { id: true, weekdayMask: true, sortOrder: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  let templatesApplied = 0;
  let entriesCreated = 0;

  for (const template of templates) {
    if ((template.weekdayMask & weekdayBit) === 0) continue;
    try {
      const result = await prisma.$transaction(async (tx) => {
        return importWorkScheduleTemplateForDate(tx, template.id, date, {
          recordApplication: true,
        });
      });
      if (!result.skipped) {
        templatesApplied += 1;
        entriesCreated += result.count;
      }
    } catch (error) {
      console.error(
        `Failed to apply work schedule template on check-in: templateId=${template.id}`,
        error
      );
    }
  }

  return { templatesApplied, entriesCreated };
}

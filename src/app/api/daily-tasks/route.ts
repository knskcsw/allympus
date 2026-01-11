import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");
  const status = searchParams.get("status");

  const where: any = {};

  // Filter by date if provided
  if (dateParam) {
    const date = new Date(dateParam);
    where.date = {
      gte: startOfDay(date),
      lte: endOfDay(date),
    };
  }

  // Filter by status if provided
  if (status) {
    where.status = status;
  }

  const dailyTasks = await prisma.dailyTask.findMany({
    where,
    orderBy: [{ date: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      timeEntries: {
        select: {
          duration: true,
        },
      },
    },
  });

  // Add total time spent for each task
  const tasksWithTotalTime = dailyTasks.map((task) => ({
    ...task,
    totalTimeSpent: task.timeEntries.reduce(
      (acc, entry) => acc + (entry.duration || 0),
      0
    ),
  }));

  return NextResponse.json(tasksWithTotalTime);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    date,
    title,
    description,
    status,
    priority,
    estimatedMinutes,
  } = body;

  // Validate required fields
  if (!date || !title) {
    return NextResponse.json(
      { error: "date and title are required" },
      { status: 400 }
    );
  }

  const dayStart = startOfDay(new Date(date));
  const dayEnd = endOfDay(new Date(date));
  const existing = await prisma.dailyTask.aggregate({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (existing._max.sortOrder ?? -1) + 1;

  const dailyTask = await prisma.dailyTask.create({
    data: {
      date: dayStart,
      title,
      description,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      estimatedMinutes,
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json(dailyTask, { status: 201 });
}

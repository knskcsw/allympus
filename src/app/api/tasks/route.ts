import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    include: {
      timeEntries: {
        select: {
          duration: true,
        },
      },
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      wbs: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const tasksWithTotalTime = tasks.map((task) => ({
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
    title,
    description,
    status,
    priority,
    dueDate,
    estimatedMinutes,
    projectId,
    wbsId,
  } = body;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedMinutes,
      projectId: projectId || null,
      wbsId: wbsId || null,
    },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      wbs: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(task, { status: 201 });
}

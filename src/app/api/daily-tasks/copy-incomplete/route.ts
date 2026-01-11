import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fromDate, toDate } = body;

  // Validate required fields
  if (!fromDate || !toDate) {
    return NextResponse.json(
      { error: "fromDate and toDate are required" },
      { status: 400 }
    );
  }

  const fromDateStart = startOfDay(new Date(fromDate));
  const fromDateEnd = endOfDay(new Date(fromDate));
  const toDateStart = startOfDay(new Date(toDate));

  // Find all incomplete tasks from the source date
  const incompleteTasks = await prisma.dailyTask.findMany({
    where: {
      date: {
        gte: fromDateStart,
        lte: fromDateEnd,
      },
      status: {
        in: ["TODO", "IN_PROGRESS"],
      },
    },
  });

  // Create copies of incomplete tasks for the target date
  const copiedTasks = await Promise.all(
    incompleteTasks.map(async (task) => {
      return prisma.dailyTask.create({
        data: {
          date: toDateStart,
          title: task.title,
          description: task.description,
          status: "TODO", // Reset status to TODO
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          sortOrder: task.sortOrder,
        },
      });
    })
  );

  return NextResponse.json({
    copied: copiedTasks.length,
    tasks: copiedTasks,
  });
}

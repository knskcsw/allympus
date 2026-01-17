import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const body = await request.json();
    const dateStr = typeof body?.date === "string" ? body.date : "";

    if (!dateStr) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    // Fetch template with items
    const template = await prisma.workScheduleTemplate.findUnique({
      where: { id: templateId },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    if (template.items.length === 0) {
      return NextResponse.json(
        { error: "Template has no items" },
        { status: 400 }
      );
    }

    if (template.items.some((item) => !item.description?.trim())) {
      return NextResponse.json(
        { error: "Template item description is required" },
        { status: 400 }
      );
    }

    // Parse date and create time entries
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);
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

    const timeEntries = [];
    for (const item of template.items) {
      const taskTitle = item.description.trim();
      const existingTask = await prisma.dailyTask.findFirst({
        where: {
          title: taskTitle,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      let dailyTaskId = existingTask?.id ?? null;
      if (!dailyTaskId) {
        const newTask = await prisma.dailyTask.create({
          data: {
            date: dayStart,
            title: taskTitle,
            status: "TODO",
            priority: "MEDIUM",
            sortOrder: nextSortOrder,
          },
        });
        dailyTaskId = newTask.id;
        nextSortOrder += 1;
      }

      const [startHour, startMinute] = item.startTime.split(":").map(Number);
      const [endHour, endMinute] = item.endTime.split(":").map(Number);

      const startTime = new Date(targetDate);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(targetDate);
      endTime.setHours(endHour, endMinute, 0, 0);

      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);

      const timeEntry = await prisma.timeEntry.create({
        data: {
          dailyTaskId,
          startTime,
          endTime,
          duration,
          note: null,
          projectId: item.projectId,
          wbsId: item.wbsId,
        },
      });

      timeEntries.push(timeEntry);
    }

    return NextResponse.json({
      success: true,
      count: timeEntries.length,
      timeEntries
    });
  } catch (error) {
    console.error("Failed to import work schedule template:", error);
    return NextResponse.json(
      { error: "Failed to import work schedule template" },
      { status: 500 }
    );
  }
}

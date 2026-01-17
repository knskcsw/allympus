import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");

  const where: Record<string, unknown> = {};

  if (date) {
    const targetDate = new Date(date);
    where.startTime = {
      gte: startOfDay(targetDate),
      lte: endOfDay(targetDate),
    };
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where,
    include: {
      dailyTask: true,
      routineTask: true,
      project: true,
      wbs: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return NextResponse.json(timeEntries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    dailyTaskId,
    routineTaskId,
    projectId,
    wbsId,
    note,
    startTime,
    endTime,
    newTaskTitle, // 新規タスク作成用
    date, // 新規タスク作成時の日付
  } = body;

  // 新規タスク作成の場合
  let finalDailyTaskId = dailyTaskId;
  if (newTaskTitle && typeof newTaskTitle === "string" && newTaskTitle.trim() !== "") {
    // 日付が必要
    if (!date) {
      return NextResponse.json(
        { error: "date is required when creating a new task" },
        { status: 400 }
      );
    }

    const dayStart = startOfDay(new Date(date));
    const dayEnd = endOfDay(new Date(date));

    // sortOrderの取得
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

    // DailyTaskを作成
    const newTask = await prisma.dailyTask.create({
      data: {
        date: dayStart,
        title: newTaskTitle.trim(),
        status: "TODO",
        priority: "MEDIUM",
        sortOrder: nextSortOrder,
      },
    });

    finalDailyTaskId = newTask.id;
  }

  const normalizedDailyTaskId =
    typeof finalDailyTaskId === "string" && finalDailyTaskId.trim() !== ""
      ? finalDailyTaskId
      : null;
  const normalizedRoutineTaskId =
    typeof routineTaskId === "string" && routineTaskId.trim() !== ""
      ? routineTaskId
      : null;

  if (normalizedDailyTaskId && normalizedRoutineTaskId) {
    return NextResponse.json(
      { error: "Only one task type can be selected" },
      { status: 400 }
    );
  }

  // startTime/endTime指定時はアクティブエントリチェックをスキップ
  const isManualEntry = startTime !== undefined;

  if (!isManualEntry) {
    const activeEntry = await prisma.timeEntry.findFirst({
      where: { endTime: null },
    });

    if (activeEntry) {
      return NextResponse.json(
        { error: "There is already an active time entry" },
        { status: 400 }
      );
    }
  }

  // duration計算（endTimeが指定されている場合）
  let duration = null;
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    duration = Math.floor((end.getTime() - start.getTime()) / 1000);
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      dailyTaskId: normalizedDailyTaskId,
      routineTaskId: normalizedRoutineTaskId,
      projectId: projectId || null,
      wbsId: wbsId || null,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      note,
    },
    include: {
      dailyTask: true,
      routineTask: true,
      project: true,
      wbs: true,
    },
  });

  return NextResponse.json(timeEntry, { status: 201 });
}

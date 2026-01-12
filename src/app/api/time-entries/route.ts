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
  const { dailyTaskId, projectId, wbsId, note, startTime, endTime } = body;

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
      dailyTaskId: dailyTaskId || null,
      projectId: projectId || null,
      wbsId: wbsId || null,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      duration,
      note,
    },
    include: {
      dailyTask: true,
      project: true,
      wbs: true,
    },
  });

  return NextResponse.json(timeEntry, { status: 201 });
}

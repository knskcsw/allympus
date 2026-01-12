import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id },
    include: {
      dailyTask: true,
      routineTask: true,
      project: true,
      wbs: true,
    },
  });

  if (!timeEntry) {
    return NextResponse.json(
      { error: "Time entry not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(timeEntry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    dailyTaskId,
    routineTaskId,
    projectId,
    wbsId,
    startTime,
    endTime,
    note,
    stop,
  } = body;
  const normalizedDailyTaskId =
    dailyTaskId === "" ? null : dailyTaskId === null ? null : dailyTaskId;
  const normalizedRoutineTaskId =
    routineTaskId === "" ? null : routineTaskId === null ? null : routineTaskId;

  if (normalizedDailyTaskId && normalizedRoutineTaskId) {
    return NextResponse.json(
      { error: "Only one task type can be selected" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};

  if (dailyTaskId !== undefined) {
    updateData.dailyTaskId = normalizedDailyTaskId;
    if (normalizedDailyTaskId) updateData.routineTaskId = null;
  }
  if (routineTaskId !== undefined) {
    updateData.routineTaskId = normalizedRoutineTaskId;
    if (normalizedRoutineTaskId) updateData.dailyTaskId = null;
  }
  if (projectId !== undefined) updateData.projectId = projectId;
  if (wbsId !== undefined) updateData.wbsId = wbsId;
  if (note !== undefined) updateData.note = note;

  // startTimeの更新
  if (startTime !== undefined) {
    updateData.startTime = new Date(startTime);
  }

  // endTimeの更新またはstop
  if (stop || endTime !== undefined) {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (entry) {
      const end = endTime ? new Date(endTime) : new Date();
      const start = startTime ? new Date(startTime) : entry.startTime;
      const duration = Math.floor(
        (end.getTime() - start.getTime()) / 1000
      );
      updateData.endTime = end;
      updateData.duration = duration;
    }
  } else if (startTime !== undefined) {
    // startTimeのみ変更された場合、既存のendTimeがあればdurationを再計算
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (entry && entry.endTime) {
      const start = new Date(startTime);
      const duration = Math.floor(
        (entry.endTime.getTime() - start.getTime()) / 1000
      );
      updateData.duration = duration;
    }
  }

  const timeEntry = await prisma.timeEntry.update({
    where: { id },
    data: updateData,
    include: {
      dailyTask: true,
      routineTask: true,
      project: true,
      wbs: true,
    },
  });

  return NextResponse.json(timeEntry);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.timeEntry.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

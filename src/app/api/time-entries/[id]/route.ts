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
      task: {
        include: {
          project: true,
        },
      },
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
  const { taskId, startTime, endTime, note, stop } = body;

  const updateData: Record<string, unknown> = {};

  if (taskId !== undefined) updateData.taskId = taskId;
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
      task: {
        include: {
          project: true,
        },
      },
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

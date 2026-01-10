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
      task: true,
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
  const { taskId, endTime, note, stop } = body;

  const updateData: Record<string, unknown> = {};

  if (taskId !== undefined) updateData.taskId = taskId;
  if (note !== undefined) updateData.note = note;

  if (stop || endTime) {
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (entry) {
      const end = endTime ? new Date(endTime) : new Date();
      const duration = Math.floor(
        (end.getTime() - entry.startTime.getTime()) / 1000
      );
      updateData.endTime = end;
      updateData.duration = duration;
    }
  }

  const timeEntry = await prisma.timeEntry.update({
    where: { id },
    data: updateData,
    include: {
      task: true,
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const dailyTask = await prisma.dailyTask.findUnique({
    where: { id },
    include: {
      timeEntries: true,
    },
  });

  if (!dailyTask) {
    return NextResponse.json({ error: "Daily task not found" }, { status: 404 });
  }

  return NextResponse.json(dailyTask);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    date,
    title,
    description,
    status,
    priority,
    estimatedMinutes,
    sortOrder,
  } = body;

  const updateData: any = {};

  if (date !== undefined) updateData.date = startOfDay(new Date(date));
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  const dailyTask = await prisma.dailyTask.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(dailyTask);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.dailyTask.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

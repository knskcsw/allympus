import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      timeEntries: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedMinutes,
      projectId: projectId !== undefined ? projectId : undefined,
      wbsId: wbsId !== undefined ? wbsId : undefined,
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

  return NextResponse.json(task);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.task.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

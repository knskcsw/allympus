import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { date, title, estimatedMinutes, projectId } = body;

  const fixedTask = await prisma.evmFixedTask.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(title ? { title } : {}),
      ...(estimatedMinutes !== undefined ? { estimatedMinutes } : {}),
      ...(projectId ? { projectId } : {}),
    },
  });

  return NextResponse.json(fixedTask);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.evmFixedTask.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : null;
  const description =
    typeof body?.description === "string" ? body.description.trim() : null;
  const sortOrder = Number.isFinite(body?.sortOrder)
    ? Number(body.sortOrder)
    : null;

  if (title !== null && title.length === 0) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  if (title === null && description === null && sortOrder === null) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (title !== null) updateData.title = title;
  if (description !== null) updateData.description = description || null;
  if (sortOrder !== null) updateData.sortOrder = sortOrder;

  try {
    const task = await prisma.routineTask.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Failed to update routine task:", error);
    return NextResponse.json(
      { error: "Failed to update routine task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.routineTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete routine task:", error);
    return NextResponse.json(
      { error: "Failed to delete routine task" },
      { status: 500 }
    );
  }
}

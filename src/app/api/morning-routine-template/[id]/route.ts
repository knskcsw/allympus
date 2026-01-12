import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : null;
  const sortOrder = Number.isFinite(body?.sortOrder)
    ? Number(body.sortOrder)
    : null;

  if (title !== null && title.length === 0) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  if (title === null && sortOrder === null) {
    return NextResponse.json(
      { error: "No fields to update" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (title !== null) updateData.title = title;
  if (sortOrder !== null) updateData.sortOrder = sortOrder;

  try {
    const item = await prisma.morningRoutineTemplateItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update morning routine template item:", error);
    return NextResponse.json(
      { error: "Failed to update morning routine template item" },
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
    await prisma.morningRoutineTemplateItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete morning routine template item:", error);
    return NextResponse.json(
      { error: "Failed to delete morning routine template item" },
      { status: 500 }
    );
  }
}

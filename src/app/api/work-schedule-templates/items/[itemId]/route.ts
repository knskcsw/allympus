import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();

    const startTime = typeof body?.startTime === "string" ? body.startTime.trim() : undefined;
    const endTime = typeof body?.endTime === "string" ? body.endTime.trim() : undefined;
    const description = typeof body?.description === "string" ? body.description.trim() : undefined;
    const projectId = body?.projectId !== undefined ? (typeof body.projectId === "string" ? body.projectId : null) : undefined;
    const wbsId = body?.wbsId !== undefined ? (typeof body.wbsId === "string" ? body.wbsId : null) : undefined;

    // Validate time format if provided
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime !== undefined && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: "Invalid startTime format. Use HH:MM" },
        { status: 400 }
      );
    }
    if (endTime !== undefined && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid endTime format. Use HH:MM" },
        { status: 400 }
      );
    }

    const item = await prisma.workScheduleTemplateItem.update({
      where: { id: itemId },
      data: {
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(description !== undefined && { description }),
        ...(projectId !== undefined && { projectId }),
        ...(wbsId !== undefined && { wbsId }),
      },
      include: {
        project: true,
        wbs: true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update work schedule template item:", error);
    return NextResponse.json(
      { error: "Failed to update work schedule template item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    await prisma.workScheduleTemplateItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete work schedule template item:", error);
    return NextResponse.json(
      { error: "Failed to delete work schedule template item" },
      { status: 500 }
    );
  }
}

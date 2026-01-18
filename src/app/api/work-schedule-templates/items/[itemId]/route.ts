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
    const allocations = Array.isArray(body?.allocations) ? body.allocations : undefined;

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

    // Validate allocations if provided
    if (allocations !== undefined) {
      if (allocations.length > 0) {
        const totalPercentage = allocations.reduce(
          (sum: number, a: any) => sum + (a.percentage || 0),
          0
        );
        if (Math.abs(totalPercentage - 100) > 0.01) {
          return NextResponse.json(
            { error: "Allocation percentages must sum to 100%" },
            { status: 400 }
          );
        }
        const hasInvalidAllocation = allocations.some(
          (a: any) => !a.projectId || typeof a.projectId !== "string"
        );
        if (hasInvalidAllocation) {
          return NextResponse.json(
            { error: "All allocations must have a projectId" },
            { status: 400 }
          );
        }
      }
    }

    // Use transaction to handle allocations update
    const item = await prisma.$transaction(async (tx) => {
      // If allocations are provided, delete existing ones and create new ones
      if (allocations !== undefined) {
        await tx.workScheduleTemplateAllocation.deleteMany({
          where: { itemId },
        });
      }

      // Update the item
      const updatedItem = await tx.workScheduleTemplateItem.update({
        where: { id: itemId },
        data: {
          ...(startTime !== undefined && { startTime }),
          ...(endTime !== undefined && { endTime }),
          ...(description !== undefined && { description }),
          ...(allocations !== undefined && {
            projectId: allocations.length > 0 ? null : projectId,
            wbsId: allocations.length > 0 ? null : wbsId,
          }),
          ...(allocations === undefined && {
            ...(projectId !== undefined && { projectId }),
            ...(wbsId !== undefined && { wbsId }),
          }),
        },
        include: {
          project: true,
          wbs: true,
          allocations: {
            include: {
              project: true,
              wbs: true,
            },
          },
        },
      });

      // Create new allocations if provided
      if (allocations !== undefined && allocations.length > 0) {
        await tx.workScheduleTemplateAllocation.createMany({
          data: allocations.map((a: any) => ({
            itemId,
            projectId: a.projectId,
            wbsId: a.wbsId || null,
            percentage: a.percentage,
          })),
        });

        // Fetch the item again with the new allocations
        return await tx.workScheduleTemplateItem.findUnique({
          where: { id: itemId },
          include: {
            project: true,
            wbs: true,
            allocations: {
              include: {
                project: true,
                wbs: true,
              },
            },
          },
        });
      }

      return updatedItem;
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

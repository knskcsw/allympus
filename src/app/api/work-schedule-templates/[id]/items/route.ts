import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const body = await request.json();

    const startTime = typeof body?.startTime === "string" ? body.startTime.trim() : "";
    const endTime = typeof body?.endTime === "string" ? body.endTime.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const projectId = typeof body?.projectId === "string" ? body.projectId : null;
    const wbsId = typeof body?.wbsId === "string" ? body.wbsId : null;
    const allocations = Array.isArray(body?.allocations) ? body.allocations : [];

    if (!startTime || !endTime || !description) {
      return NextResponse.json(
        { error: "startTime, endTime, and description are required" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM" },
        { status: 400 }
      );
    }

    // Validate allocations if provided
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

    const existing = await prisma.workScheduleTemplateItem.aggregate({
      where: { templateId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (existing._max.sortOrder ?? -1) + 1;

    const item = await prisma.workScheduleTemplateItem.create({
      data: {
        templateId,
        startTime,
        endTime,
        description,
        projectId: allocations.length > 0 ? null : projectId,
        wbsId: allocations.length > 0 ? null : wbsId,
        sortOrder: nextSortOrder,
        allocations: allocations.length > 0 ? {
          create: allocations.map((a: any) => ({
            projectId: a.projectId,
            wbsId: a.wbsId || null,
            percentage: a.percentage,
          })),
        } : undefined,
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

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create work schedule template item:", error);
    return NextResponse.json(
      { error: "Failed to create work schedule template item" },
      { status: 500 }
    );
  }
}

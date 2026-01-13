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
        projectId,
        wbsId,
        sortOrder: nextSortOrder,
      },
      include: {
        project: true,
        wbs: true,
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

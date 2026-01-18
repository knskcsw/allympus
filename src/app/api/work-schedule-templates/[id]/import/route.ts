import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { importWorkScheduleTemplateForDate } from "@/lib/workScheduleTemplateImport";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const body = await request.json();
    const dateStr = typeof body?.date === "string" ? body.date : "";

    if (!dateStr) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      return importWorkScheduleTemplateForDate(tx, templateId, targetDate);
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error("Failed to import work schedule template:", error);
    const message =
      error instanceof Error ? error.message : "Failed to import work schedule template";
    if (message === "Template not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    if (
      message === "Template has no items" ||
      message === "Template item description is required" ||
      message === "Invalid time format in template item"
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to import work schedule template" },
      { status: 500 }
    );
  }
}

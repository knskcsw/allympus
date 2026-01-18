import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.workScheduleTemplate.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            project: true,
            wbs: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to fetch work schedule template:", error);
    return NextResponse.json(
      { error: "Failed to fetch work schedule template" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : undefined;
    const weekdayMaskRaw = body?.weekdayMask;
    const weekdayMask =
      weekdayMaskRaw === undefined ? undefined : Number(weekdayMaskRaw);

    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: "name cannot be empty" },
        { status: 400 }
      );
    }

    if (weekdayMask !== undefined) {
      if (!Number.isInteger(weekdayMask) || weekdayMask < 0 || weekdayMask > 127) {
        return NextResponse.json(
          { error: "weekdayMask must be an integer between 0 and 127" },
          { status: 400 }
        );
      }
    }

    const template = await prisma.workScheduleTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(weekdayMask !== undefined && { weekdayMask }),
      },
      include: {
        items: {
          include: {
            project: true,
            wbs: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Failed to update work schedule template:", error);
    return NextResponse.json(
      { error: "Failed to update work schedule template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.workScheduleTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete work schedule template:", error);
    return NextResponse.json(
      { error: "Failed to delete work schedule template" },
      { status: 500 }
    );
  }
}

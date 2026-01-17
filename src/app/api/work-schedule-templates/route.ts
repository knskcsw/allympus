import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.workScheduleTemplate.findMany({
      include: {
        items: {
          include: {
            project: true,
            wbs: true,
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch work schedule templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch work schedule templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.workScheduleTemplate.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (existing._max.sortOrder ?? -1) + 1;

    const template = await prisma.workScheduleTemplate.create({
      data: {
        name,
        sortOrder: nextSortOrder,
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

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Failed to create work schedule template:", error);
    return NextResponse.json(
      { error: "Failed to create work schedule template" },
      { status: 500 }
    );
  }
}

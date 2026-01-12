import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const items = await prisma.morningRoutineTemplateItem.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "title is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.morningRoutineTemplateItem.aggregate({
      _max: { sortOrder: true },
    });
    const nextSortOrder = (existing._max.sortOrder ?? -1) + 1;

    const item = await prisma.morningRoutineTemplateItem.create({
      data: {
        title,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create morning routine template item:", error);
    return NextResponse.json(
      { error: "Failed to create morning routine template item" },
      { status: 500 }
    );
  }
}

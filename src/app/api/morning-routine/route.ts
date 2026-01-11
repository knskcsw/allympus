import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json(
      { error: "date parameter is required" },
      { status: 400 }
    );
  }

  const date = new Date(dateParam);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const items = await prisma.morningRoutineItem.findMany({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title =
      typeof body?.title === "string" ? body.title.trim() : "";
    const dateParam = body?.date;

    if (!title || !dateParam) {
      return NextResponse.json(
        { error: "title and date are required" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const existing = await prisma.morningRoutineItem.aggregate({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      _max: { sortOrder: true },
    });

    const nextSortOrder = (existing._max.sortOrder ?? -1) + 1;

    const item = await prisma.morningRoutineItem.create({
      data: {
        date: dayStart,
        title,
        completed: false,
        sortOrder: nextSortOrder,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create morning routine item:", error);
    return NextResponse.json(
      { error: "Failed to create morning routine item" },
      { status: 500 }
    );
  }
}

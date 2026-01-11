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

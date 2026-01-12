import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dateParam = body?.date;
    const overwrite = Boolean(body?.overwrite);

    if (!dateParam) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const templateItems = await prisma.morningRoutineTemplateItem.findMany({
      orderBy: { sortOrder: "asc" },
    });

    if (templateItems.length === 0) {
      return NextResponse.json(
        { error: "テンプレートが未設定です" },
        { status: 400 }
      );
    }

    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const existingItems = await prisma.morningRoutineItem.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (existingItems.length > 0 && !overwrite) {
      return NextResponse.json(
        { error: "既存のルーティンがあります" },
        { status: 409 }
      );
    }

    if (overwrite) {
      await prisma.morningRoutineItem.deleteMany({
        where: {
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });
    }

    await prisma.morningRoutineItem.createMany({
      data: templateItems.map((item, index) => ({
        date: dayStart,
        title: item.title,
        completed: false,
        sortOrder: item.sortOrder ?? index,
      })),
    });

    return NextResponse.json({
      imported: templateItems.length,
    });
  } catch (error) {
    console.error("Failed to import morning routine template:", error);
    return NextResponse.json(
      { error: "Failed to import morning routine template" },
      { status: 500 }
    );
  }
}

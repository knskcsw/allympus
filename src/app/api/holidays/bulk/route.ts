import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/holidays/bulk
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { holidays } = body;

    if (!Array.isArray(holidays)) {
      return NextResponse.json(
        { error: "holidays must be an array" },
        { status: 400 }
      );
    }

    // Type validation
    const validTypes = ["PUBLIC_HOLIDAY", "WEEKEND", "SPECIAL_HOLIDAY", "PAID_LEAVE"];

    // Validate all holidays
    for (const holiday of holidays) {
      const { date, name, type, fiscalYear } = holiday;

      if (!date || !name || !type || !fiscalYear) {
        return NextResponse.json(
          { error: "Each holiday must have: date, name, type, fiscalYear" },
          { status: 400 }
        );
      }

      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            error: `Invalid type: ${type}. Must be one of: ${validTypes.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Upsert all holidays
    const results = await Promise.all(
      holidays.map((holiday) =>
        prisma.holiday.upsert({
          where: { date: new Date(holiday.date) },
          update: {
            name: holiday.name,
            type: holiday.type,
            fiscalYear: holiday.fiscalYear,
          },
          create: {
            date: new Date(holiday.date),
            name: holiday.name,
            type: holiday.type,
            fiscalYear: holiday.fiscalYear,
          },
        })
      )
    );

    return NextResponse.json(
      { message: `${results.length} holidays created/updated`, results },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to bulk create holidays:", error);
    return NextResponse.json(
      { error: "Failed to bulk create holidays" },
      { status: 500 }
    );
  }
}

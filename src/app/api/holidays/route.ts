import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/holidays?fiscalYear=FY25
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fiscalYear = searchParams.get("fiscalYear");

    const where = fiscalYear ? { fiscalYear } : {};

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Failed to fetch holidays:", error);
    return NextResponse.json(
      { error: "Failed to fetch holidays" },
      { status: 500 }
    );
  }
}

// POST /api/holidays
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, name, type, fiscalYear } = body;

    // Validation
    if (!date || !name || !type || !fiscalYear) {
      return NextResponse.json(
        { error: "Missing required fields: date, name, type, fiscalYear" },
        { status: 400 }
      );
    }

    // Type validation
    const validTypes = ["PUBLIC_HOLIDAY", "WEEKEND", "SPECIAL_HOLIDAY", "PAID_LEAVE"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Upsert (create or update if same date exists)
    const holiday = await prisma.holiday.upsert({
      where: { date: new Date(date) },
      update: {
        name,
        type,
        fiscalYear,
      },
      create: {
        date: new Date(date),
        name,
        type,
        fiscalYear,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error("Failed to create holiday:", error);
    return NextResponse.json(
      { error: "Failed to create holiday" },
      { status: 500 }
    );
  }
}

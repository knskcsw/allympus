import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fiscalYear = searchParams.get("fiscalYear");

  let where = {};
  if (fiscalYear) {
    // FY25 means April 2025 to March 2026
    const startYear = parseInt(fiscalYear.replace("FY", "")) + 2000;
    const startDate = new Date(startYear, 3, 1); // April 1st
    const endDate = new Date(startYear + 1, 2, 31); // March 31st

    where = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };
  }

  const vacations = await prisma.vacation.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(vacations);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, type, hours, note } = body;

  const vacation = await prisma.vacation.create({
    data: {
      date: new Date(date),
      type,
      hours,
      note,
    },
  });

  return NextResponse.json(vacation, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "id parameter is required" },
      { status: 400 }
    );
  }

  await prisma.vacation.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

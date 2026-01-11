import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fiscalYear = searchParams.get("fiscalYear");

  if (!fiscalYear) {
    return NextResponse.json(
      { error: "fiscalYear parameter is required" },
      { status: 400 }
    );
  }

  const vacationHours = await prisma.monthlyVacationHours.findMany({
    where: {
      fiscalYear,
    },
    orderBy: { month: "asc" },
  });

  return NextResponse.json(vacationHours);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { updates } = body; // Array of updates

  if (!Array.isArray(updates)) {
    return NextResponse.json(
      { error: "updates must be an array" },
      { status: 400 }
    );
  }

  const results = await Promise.all(
    updates.map(async (update: any) => {
      const { fiscalYear, month, hours } = update;

      const existing = await prisma.monthlyVacationHours.findUnique({
        where: {
          fiscalYear_month: {
            fiscalYear,
            month,
          },
        },
      });

      if (existing) {
        return prisma.monthlyVacationHours.update({
          where: {
            id: existing.id,
          },
          data: {
            hours,
          },
        });
      } else {
        return prisma.monthlyVacationHours.create({
          data: {
            fiscalYear,
            month,
            hours,
          },
        });
      }
    })
  );

  return NextResponse.json(results);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDaysInMonth, startOfMonth, endOfMonth } from "date-fns";

// GET /api/holidays/working-days?fiscalYear=FY25
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fiscalYear = searchParams.get("fiscalYear");

    if (!fiscalYear) {
      return NextResponse.json(
        { error: "fiscalYear parameter is required" },
        { status: 400 }
      );
    }

    // Extract year from fiscalYear (e.g., "FY25" -> 2025)
    const yearNum = parseInt(fiscalYear.replace("FY", ""), 10) + 2000;

    // Fiscal year months: April (yearNum) to March (yearNum+1)
    const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

    const workingDays: { [key: number]: number } = {};

    for (const month of MONTHS) {
      // Determine the year for this month
      const year = month >= 4 ? yearNum : yearNum + 1;

      // Get total days in this month
      const totalDays = getDaysInMonth(new Date(year, month - 1));

      // Get holidays in this month
      const monthStart = startOfMonth(new Date(year, month - 1));
      const monthEnd = endOfMonth(new Date(year, month - 1));

      const holidays = await prisma.holiday.findMany({
        where: {
          fiscalYear,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const holidayCount = holidays.length;

      // Calculate working days (total days - holidays)
      // Ensure it doesn't go below 0
      workingDays[month] = Math.max(0, totalDays - holidayCount);
    }

    return NextResponse.json({
      fiscalYear,
      workingDays,
    });
  } catch (error) {
    console.error("Failed to calculate working days:", error);
    return NextResponse.json(
      { error: "Failed to calculate working days" },
      { status: 500 }
    );
  }
}

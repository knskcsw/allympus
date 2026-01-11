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

  // FY25 means April 2025 to March 2026
  const startYear = parseInt(fiscalYear.replace("FY", "")) + 2000;
  const startDate = new Date(startYear, 3, 1); // April 1st
  const endDate = new Date(startYear + 1, 2, 31, 23, 59, 59); // March 31st

  // Fetch all time entries for the fiscal year
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      startTime: {
        gte: startDate,
        lte: endDate,
      },
      projectId: {
        not: null,
      },
      endTime: {
        not: null,
      },
    },
    select: {
      projectId: true,
      startTime: true,
      duration: true,
    },
  });

  // Aggregate by project and month
  const aggregated: {
    [projectId: string]: { [month: number]: number };
  } = {};

  for (const entry of timeEntries) {
    if (!entry.projectId || !entry.duration) continue;

    const date = new Date(entry.startTime);
    const month = date.getMonth() + 1; // 1-12

    if (!aggregated[entry.projectId]) {
      aggregated[entry.projectId] = {};
    }
    if (!aggregated[entry.projectId][month]) {
      aggregated[entry.projectId][month] = 0;
    }

    // Convert duration from minutes to hours
    aggregated[entry.projectId][month] += entry.duration / 60;
  }

  // Convert to array format
  const result = [];
  for (const projectId in aggregated) {
    for (const month in aggregated[projectId]) {
      result.push({
        projectId,
        month: parseInt(month),
        hours: aggregated[projectId][month],
      });
    }
  }

  return NextResponse.json(result);
}

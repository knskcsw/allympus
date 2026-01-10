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

  const workHours = await prisma.projectWorkHours.findMany({
    where: {
      fiscalYear,
    },
    include: {
      project: true,
    },
    orderBy: [{ projectId: "asc" }, { month: "asc" }],
  });

  return NextResponse.json(workHours);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectId, fiscalYear, month, estimatedHours, actualHours, overtimeHours, workingDays } = body;

  // Check if record exists
  const existing = await prisma.projectWorkHours.findUnique({
    where: {
      projectId_fiscalYear_month: {
        projectId,
        fiscalYear,
        month,
      },
    },
  });

  let workHours;
  if (existing) {
    // Update existing record
    workHours = await prisma.projectWorkHours.update({
      where: {
        id: existing.id,
      },
      data: {
        estimatedHours,
        actualHours,
        overtimeHours,
        workingDays,
      },
      include: {
        project: true,
      },
    });
  } else {
    // Create new record
    workHours = await prisma.projectWorkHours.create({
      data: {
        projectId,
        fiscalYear,
        month,
        estimatedHours,
        actualHours,
        overtimeHours,
        workingDays,
      },
      include: {
        project: true,
      },
    });
  }

  return NextResponse.json(workHours, { status: existing ? 200 : 201 });
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
      const { projectId, fiscalYear, month, estimatedHours, actualHours, overtimeHours, workingDays } = update;

      const existing = await prisma.projectWorkHours.findUnique({
        where: {
          projectId_fiscalYear_month: {
            projectId,
            fiscalYear,
            month,
          },
        },
      });

      if (existing) {
        return prisma.projectWorkHours.update({
          where: {
            id: existing.id,
          },
          data: {
            estimatedHours,
            actualHours,
            overtimeHours,
            workingDays,
          },
        });
      } else {
        return prisma.projectWorkHours.create({
          data: {
            projectId,
            fiscalYear,
            month,
            estimatedHours,
            actualHours,
            overtimeHours,
            workingDays,
          },
        });
      }
    })
  );

  return NextResponse.json(results);
}

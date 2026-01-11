import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { endOfMonth, startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  const projectId = searchParams.get("projectId");

  if (!year || !month) {
    return NextResponse.json(
      { error: "year and month are required" },
      { status: 400 }
    );
  }

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const tasks = await prisma.evmFixedTask.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date, title, estimatedMinutes, projectId } = body;

  if (!date || !title || !projectId || !estimatedMinutes) {
    return NextResponse.json(
      { error: "date, title, projectId, estimatedMinutes are required" },
      { status: 400 }
    );
  }

  const fixedTask = await prisma.evmFixedTask.create({
    data: {
      date: new Date(date),
      title,
      projectId,
      estimatedMinutes,
    },
  });

  return NextResponse.json(fixedTask, { status: 201 });
}

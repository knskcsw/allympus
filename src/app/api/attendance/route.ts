import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay, endOfMonth, startOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get("year");
  const month = searchParams.get("month");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let where = {};

  // startDateとendDateが指定されている場合は日付範囲で検索
  if (startDate && endDate) {
    where = {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };
  } else if (year && month) {
    // yearとmonthが指定されている場合は月単位で検索
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    where = {
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    };
  }

  const attendances = await prisma.attendance.findMany({
    where,
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(attendances);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type } = body;

  const today = startOfDay(new Date());
  const now = new Date();

  let attendance = await prisma.attendance.findFirst({
    where: {
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  if (type === "clockIn") {
    if (attendance?.clockIn) {
      return NextResponse.json(
        { error: "Already clocked in today" },
        { status: 400 }
      );
    }

    if (attendance) {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { clockIn: now },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          date: today,
          clockIn: now,
        },
      });
    }
  } else if (type === "clockOut") {
    if (!attendance?.clockIn) {
      return NextResponse.json(
        { error: "Not clocked in yet" },
        { status: 400 }
      );
    }

    if (attendance.clockOut) {
      return NextResponse.json(
        { error: "Already clocked out today" },
        { status: 400 }
      );
    }

    attendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { clockOut: now },
    });
  }

  return NextResponse.json(attendance);
}

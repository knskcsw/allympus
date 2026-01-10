import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfDay } from "date-fns";

export async function GET() {
  const today = startOfDay(new Date());

  const attendance = await prisma.attendance.findFirst({
    where: {
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  return NextResponse.json(attendance);
}

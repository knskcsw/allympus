import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const activeEntry = await prisma.timeEntry.findFirst({
    where: { endTime: null },
    include: {
      dailyTask: true,
      project: true,
      wbs: true,
    },
  });

  return NextResponse.json(activeEntry);
}

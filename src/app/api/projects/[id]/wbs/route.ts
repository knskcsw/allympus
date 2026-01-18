import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await request.json();
  const { name, abbreviation } = body;

  const wbs = await prisma.wbs.create({
    data: {
      projectId,
      name,
      ...(abbreviation !== undefined && { abbreviation }),
    },
  });

  return NextResponse.json(wbs, { status: 201 });
}

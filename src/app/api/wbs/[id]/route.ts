import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { name } = body;

  const wbs = await prisma.wbs.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(wbs);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.wbs.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

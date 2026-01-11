import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { completed } = body;

    const item = await prisma.morningRoutineItem.update({
      where: { id },
      data: { completed: Boolean(completed) },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to update morning routine item:", error);
    return NextResponse.json(
      { error: "Failed to update morning routine item" },
      { status: 500 }
    );
  }
}

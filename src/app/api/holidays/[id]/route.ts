import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE /api/holidays/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check if holiday exists
    const existing = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Holiday not found" },
        { status: 404 }
      );
    }

    // Delete holiday
    await prisma.holiday.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Holiday deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete holiday:", error);
    return NextResponse.json(
      { error: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}

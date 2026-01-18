import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: { completed?: boolean; title?: string; note?: string | null } = {};

    if (Object.prototype.hasOwnProperty.call(body, "completed")) {
      data.completed = Boolean(body.completed);
    }

    if (typeof body?.title === "string") {
      const title = body.title.trim();
      if (!title) {
        return NextResponse.json(
          { error: "title cannot be empty" },
          { status: 400 }
        );
      }
      data.title = title;
    }

    // Handle note field - can be string (update) or null (delete)
    if (Object.prototype.hasOwnProperty.call(body, "note")) {
      if (body.note === null || body.note === "") {
        data.note = null;
      } else if (typeof body.note === "string") {
        data.note = body.note;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No updatable fields provided" },
        { status: 400 }
      );
    }

    const item = await prisma.morningRoutineItem.update({
      where: { id },
      data,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.morningRoutineItem.delete({ where: { id } });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Failed to delete morning routine item:", error);
    return NextResponse.json(
      { error: "Failed to delete morning routine item" },
      { status: 500 }
    );
  }
}

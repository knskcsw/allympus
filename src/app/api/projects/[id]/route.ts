import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      wbsList: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const {
    code,
    name,
    abbreviation,
    workType,
    isActive,
    isKadminActive,
    sortOrder,
    kadminSortOrder,
  } = body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(code && { code }),
      ...(name && { name }),
      ...(abbreviation !== undefined && { abbreviation }),
      ...(workType && { workType }),
      ...(isActive !== undefined && { isActive }),
      ...(isKadminActive !== undefined && { isKadminActive }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(kadminSortOrder !== undefined && { kadminSortOrder }),
    },
    include: {
      wbsList: true,
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.project.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectIds } = body as { projectIds?: string[] };

  if (!projectIds || !Array.isArray(projectIds)) {
    return NextResponse.json(
      { error: "projectIds is required" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    projectIds.map((projectId, index) =>
      prisma.project.update({
        where: { id: projectId },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ success: true });
}

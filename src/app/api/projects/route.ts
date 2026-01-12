import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeInactive = searchParams.get("includeInactive") === "true";

  const projects = await prisma.project.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      wbsList: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, name, abbreviation, wbsList, workType } = body;

  const project = await prisma.project.create({
    data: {
      code,
      name,
      abbreviation,
      ...(workType && { workType }),
      wbsList: wbsList?.length
        ? {
            create: wbsList.map((wbs: { name: string }) => ({
              name: wbs.name,
            })),
          }
        : undefined,
    },
    include: {
      wbsList: true,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

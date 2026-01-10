import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      wbsList: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, name, wbsList } = body;

  const project = await prisma.project.create({
    data: {
      code,
      name,
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

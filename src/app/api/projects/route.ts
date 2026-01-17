import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const includeInactive = searchParams.get("includeInactive") === "true";
  const kadminActiveOnly = searchParams.get("kadminActive") === "true";

  const filters: { isActive?: boolean; isKadminActive?: boolean }[] = [];
  if (!includeInactive) {
    filters.push({ isActive: true });
  }
  if (kadminActiveOnly) {
    filters.push({ isKadminActive: true });
  }

  // Fetch all projects and sort in memory for complex multi-field sorting
  const allProjects = await prisma.project.findMany({
    where: filters.length ? { AND: filters } : {},
    include: {
      wbsList: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  // Complex sorting logic:
  // 1. Active & KadminActive (top priority)
  // 2. Active & !KadminActive
  // 3. !Active & KadminActive
  // 4. !Active & !KadminActive (bottom)
  const projects = allProjects.sort((a, b) => {
    const aPriority = a.isActive ? (a.isKadminActive ? 0 : 1) : (a.isKadminActive ? 2 : 3);
    const bPriority = b.isActive ? (b.isKadminActive ? 0 : 1) : (b.isKadminActive ? 2 : 3);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Within same priority group, sort by appropriate sortOrder
    if (kadminActiveOnly) {
      return a.kadminSortOrder - b.kadminSortOrder;
    } else {
      return a.sortOrder - b.sortOrder;
    }
  });

  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { code, name, abbreviation, wbsList, workType } = body;
  const lastSortOrder = await prisma.project.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const nextSortOrder = (lastSortOrder?.sortOrder ?? 0) + 1;
  const lastKadminSortOrder = await prisma.project.findFirst({
    orderBy: { kadminSortOrder: "desc" },
    select: { kadminSortOrder: true },
  });
  const nextKadminSortOrder = (lastKadminSortOrder?.kadminSortOrder ?? 0) + 1;

  const project = await prisma.project.create({
    data: {
      code,
      name,
      abbreviation,
      isKadminActive: true,
      sortOrder: nextSortOrder,
      kadminSortOrder: nextKadminSortOrder,
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

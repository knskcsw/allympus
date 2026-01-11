import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizePayload = (payload: Record<string, unknown>) => ({
  gross: toNumber(payload.gross),
  net: toNumber(payload.net),
  healthInsurance: toNumber(payload.healthInsurance),
  pension: toNumber(payload.pension),
  employmentInsurance: toNumber(payload.employmentInsurance),
  incomeTax: toNumber(payload.incomeTax),
  residentTax: toNumber(payload.residentTax),
  otherDeductions: toNumber(payload.otherDeductions),
  bonus: toNumber(payload.bonus),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : NaN;

  if (!Number.isFinite(year)) {
    return NextResponse.json(
      { error: "year parameter is required" },
      { status: 400 }
    );
  }

  const records = await prisma.salaryRecord.findMany({
    where: { year },
    orderBy: { month: "asc" },
  });

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const year = Number(body.year);
  const month = Number(body.month);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return NextResponse.json(
      { error: "year and month are required" },
      { status: 400 }
    );
  }

  const data = normalizePayload(body);

  const record = await prisma.salaryRecord.upsert({
    where: {
      year_month: {
        year,
        month,
      },
    },
    update: data,
    create: {
      year,
      month,
      ...data,
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const year = Number(body.year);
  const month = Number(body.month);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return NextResponse.json(
      { error: "year and month are required" },
      { status: 400 }
    );
  }

  const record = await prisma.salaryRecord.delete({
    where: {
      year_month: {
        year,
        month,
      },
    },
  });

  return NextResponse.json(record);
}

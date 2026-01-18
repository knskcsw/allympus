/**
 * 週報API
 * GET: 週報を取得
 * POST: 週報を保存・更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/weekly-reports?weekStart=yyyy-MM-dd
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const weekStart = searchParams.get('weekStart');

    if (!weekStart) {
      return NextResponse.json(
        { error: 'weekStartパラメータが必要です' },
        { status: 400 }
      );
    }

    const weekStartDate = new Date(weekStart);

    const report = await db.weeklyReport.findUnique({
      where: {
        weekStart: weekStartDate,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('週報取得エラー:', error);
    return NextResponse.json(
      { error: '週報取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST /api/weekly-reports
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { weekStart, weekEnd, content } = body;

    if (!weekStart || !weekEnd || content === undefined) {
      return NextResponse.json(
        { error: 'weekStart, weekEnd, contentが必要です' },
        { status: 400 }
      );
    }

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekEnd);

    const report = await db.weeklyReport.upsert({
      where: {
        weekStart: weekStartDate,
      },
      create: {
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        content,
      },
      update: {
        content,
        weekEnd: weekEndDate,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('週報保存エラー:', error);
    return NextResponse.json(
      { error: '週報保存に失敗しました' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Papa from "papaparse";

type CSVRow = {
  projectCode: string;
  projectName: string;
  wbsNo: string;
  wbsName: string;
  wbsClass: string;
  member: string;
  startDate: string;
  endDate: string;
};

type ImportResult = {
  success: boolean;
  projectsCreated: number;
  projectsUpdated: number;
  wbsCreated: number;
  errors: Array<{ row: number; message: string }>;
};

function cleanString(value: string): string {
  if (!value) return "";
  // シングルクォートを除去
  return value.replace(/^['']|['']$/g, "").trim();
}

function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  // "2024/4/1" 形式をパース
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // 0-indexed
  const day = parseInt(parts[2]);
  return new Date(year, month, day);
}

function parseWbsNoToSortOrder(wbsNo: string): number {
  if (!wbsNo) return 0;
  // "1." -> 1, "2.1" -> 21, "3.2.1" -> 321
  const cleanNo = wbsNo.replace(/\.$/, "");
  const parts = cleanNo.split(".");
  return parseInt(parts.join("")) || 0;
}

function groupByProjectCode(data: CSVRow[]): Record<string, CSVRow[]> {
  const groups: Record<string, CSVRow[]> = {};
  for (const row of data) {
    if (!row.projectCode) continue;
    if (!groups[row.projectCode]) {
      groups[row.projectCode] = [];
    }
    groups[row.projectCode].push(row);
  }
  return groups;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csvContent } = body;

    if (!csvContent) {
      return NextResponse.json(
        { error: "csvContent is required" },
        { status: 400 }
      );
    }

    // CSVパース
    const parsed = Papa.parse<string[]>(csvContent, {
      skipEmptyLines: true,
      header: false,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parse error", details: parsed.errors },
        { status: 400 }
      );
    }

    // ヘッダー行をスキップ（1行目）
    const dataRows = parsed.data.slice(1);

    // データ変換・クリーニング
    const cleanedData: CSVRow[] = dataRows.map((row) => {
      return {
        projectCode: cleanString(row[0]),      // A列
        projectName: cleanString(row[1]),      // B列
        wbsNo: cleanString(row[2]),           // C列
        wbsName: cleanString(row[3]),         // D列
        wbsClass: cleanString(row[4]),        // E列
        member: cleanString(row[8]),          // I列（インデックス8）
        startDate: cleanString(row[10]),      // K列
        endDate: cleanString(row[11]),        // L列
      };
    });

    // プロジェクトコードでグループ化
    const projectGroups = groupByProjectCode(cleanedData);

    const result: ImportResult = {
      success: true,
      projectsCreated: 0,
      projectsUpdated: 0,
      wbsCreated: 0,
      errors: [],
    };

    // トランザクション処理
    await prisma.$transaction(async (tx) => {
      const lastSortOrder = await tx.project.findFirst({
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      let nextSortOrder = (lastSortOrder?.sortOrder ?? 0) + 1;
      const lastKadminSortOrder = await tx.project.findFirst({
        orderBy: { kadminSortOrder: "desc" },
        select: { kadminSortOrder: true },
      });
      let nextKadminSortOrder = (lastKadminSortOrder?.kadminSortOrder ?? 0) + 1;

      for (const [projectCode, rows] of Object.entries(projectGroups)) {
        try {
          // バリデーション
          if (!projectCode) {
            result.errors.push({
              row: 0,
              message: "Project Code is empty",
            });
            continue;
          }

          // 最初の行からプロジェクト情報を取得
          const firstRow = rows[0];

          if (!firstRow.projectName) {
            result.errors.push({
              row: 0,
              message: `Project ${projectCode}: Project Name is empty`,
            });
            continue;
          }

          // 日付変換
          const startDate = parseDateString(firstRow.startDate);
          const endDate = parseDateString(firstRow.endDate);

          // プロジェクトのupsert
          const existingProject = await tx.project.findUnique({
            where: { code: projectCode },
          });

          const project = await tx.project.upsert({
            where: { code: projectCode },
            update: {
              name: firstRow.projectName,
              member: firstRow.member || null,
              startDate,
              endDate,
            },
            create: {
              code: projectCode,
              name: firstRow.projectName,
              member: firstRow.member || null,
              startDate,
              endDate,
              isActive: true,
              isKadminActive: true,
              sortOrder: nextSortOrder,
              kadminSortOrder: nextKadminSortOrder,
            },
          });

          if (existingProject) {
            result.projectsUpdated++;
          } else {
            result.projectsCreated++;
            nextSortOrder += 1;
            nextKadminSortOrder += 1;
          }

          // WBSの作成（既存のWBSは削除して再作成）
          await tx.wbs.deleteMany({
            where: { projectId: project.id },
          });

          // 各行からWBSを作成
          for (const row of rows) {
            if (row.wbsName) {
              const sortOrder = parseWbsNoToSortOrder(row.wbsNo);
              await tx.wbs.create({
                data: {
                  projectId: project.id,
                  name: row.wbsName,
                  wbsNo: row.wbsNo || null,
                  wbsClass: row.wbsClass || null,
                  sortOrder,
                },
              });
              result.wbsCreated++;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          result.errors.push({
            row: 0,
            message: `Project ${projectCode}: ${errorMessage}`,
          });
        }
      }
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("CSV import failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "CSV import failed", details: errorMessage },
      { status: 500 }
    );
  }
}

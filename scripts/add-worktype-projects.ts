import { prisma } from "../src/lib/db";
import { WorkType } from "../src/generated/prisma/client";

const projects = [
  {
    code: "T2-001",
    name: "T2営業支援",
    abbreviation: "T2営業",
    workType: WorkType.SE_TRANSFER,
    wbs: ["営業資料作成", "顧客対応", "提案準備"],
  },
  {
    code: "IND-001",
    name: "間接業務",
    abbreviation: "間接",
    workType: WorkType.INDIRECT,
    wbs: ["社内ミーティング", "業務改善", "育成・教育"],
  },
];

async function main() {
  for (const project of projects) {
    const record = await prisma.project.upsert({
      where: { code: project.code },
      update: {
        name: project.name,
        abbreviation: project.abbreviation,
        workType: project.workType,
      },
      create: {
        code: project.code,
        name: project.name,
        abbreviation: project.abbreviation,
        workType: project.workType,
      },
    });

    const existingWbs = await prisma.wbs.findMany({
      where: { projectId: record.id },
    });
    const existingNames = new Set(existingWbs.map((wbs) => wbs.name));

    const wbsToCreate = project.wbs.filter((name) => !existingNames.has(name));
    if (wbsToCreate.length) {
      await prisma.wbs.createMany({
        data: wbsToCreate.map((name) => ({
          projectId: record.id,
          name,
        })),
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

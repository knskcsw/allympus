import { prisma } from "../src/lib/db";

const FISCAL_YEAR = "FY25";
const TARGET_MONTH = 1;

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { code: "asc" },
  });

  for (const [index, project] of projects.entries()) {
    const estimatedHours = 90 + index * 6;
    const actualHours = Math.max(0, estimatedHours - 8 + (index % 3) * 2);
    const overtimeHours = Math.max(0, actualHours - estimatedHours + 6);
    const workingDays = 20;

    await prisma.projectWorkHours.upsert({
      where: {
        projectId_fiscalYear_month: {
          projectId: project.id,
          fiscalYear: FISCAL_YEAR,
          month: TARGET_MONTH,
        },
      },
      update: {
        estimatedHours,
        actualHours,
        overtimeHours,
        workingDays,
      },
      create: {
        projectId: project.id,
        fiscalYear: FISCAL_YEAR,
        month: TARGET_MONTH,
        estimatedHours,
        actualHours,
        overtimeHours,
        workingDays,
      },
    });
  }

  await prisma.monthlyVacationHours.upsert({
    where: {
      fiscalYear_month: {
        fiscalYear: FISCAL_YEAR,
        month: TARGET_MONTH,
      },
    },
    update: {
      hours: 8,
    },
    create: {
      fiscalYear: FISCAL_YEAR,
      month: TARGET_MONTH,
      hours: 8,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

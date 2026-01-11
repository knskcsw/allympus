import { addDays, eachDayOfInterval, endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "../src/lib/db";

const TARGET_MONTH = { year: 2026, month: 1 };

const projectSeeds = [
  { name: "顧客管理システムリニューアル", hoursPerDay: 3.5 },
  { name: "ECサイト新規構築", hoursPerDay: 3.0 },
  { name: "社内業務システム改善", hoursPerDay: 2.5 },
  { name: "T2営業支援", hoursPerDay: 2.0 },
  { name: "間接業務", hoursPerDay: 1.5 },
];

function isWeekday(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function getFiscalYear(year: number, month: number) {
  const fiscalYear = month >= 4 ? year : year - 1;
  const suffix = String(fiscalYear % 100).padStart(2, "0");
  return `FY${suffix}`;
}

async function ensureWorkHours(projectId: string, fiscalYear: string, month: number) {
  await prisma.projectWorkHours.upsert({
    where: {
      projectId_fiscalYear_month: {
        projectId,
        fiscalYear,
        month,
      },
    },
    update: {},
    create: {
      projectId,
      fiscalYear,
      month,
      estimatedHours: 80,
      actualHours: 0,
      overtimeHours: 0,
      workingDays: 0,
      vacationHours: 0,
    },
  });
}

async function main() {
  const start = startOfMonth(new Date(TARGET_MONTH.year, TARGET_MONTH.month - 1));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end }).filter(isWeekday);
  const fiscalYear = getFiscalYear(TARGET_MONTH.year, TARGET_MONTH.month);
  const sampleDays = days.slice(0, 10);

  for (const seed of projectSeeds) {
    const project = await prisma.project.findFirst({
      where: { name: seed.name },
      include: { wbsList: true },
    });
    if (!project) continue;

    await ensureWorkHours(project.id, fiscalYear, TARGET_MONTH.month);

    const wbs = project.wbsList[0];
    if (!wbs) continue;

    for (const day of sampleDays) {
      const startTime = addDays(new Date(day), 0);
      startTime.setHours(10, 0, 0, 0);
      const endTime = addDays(new Date(day), 0);
      endTime.setHours(10 + Math.floor(seed.hoursPerDay), 30, 0, 0);
      const durationSeconds = Math.floor(seed.hoursPerDay * 3600);

      await prisma.timeEntry.create({
        data: {
          projectId: project.id,
          wbsId: wbs.id,
          startTime,
          endTime,
          duration: durationSeconds,
          note: `${project.name} sample`,
        },
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

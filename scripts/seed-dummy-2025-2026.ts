import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isWeekend,
  startOfMonth,
} from "date-fns";
import { prisma } from "../src/lib/db";
import { WorkType } from "../src/generated/prisma/client";

const RANGE_START = new Date(2025, 3, 1);
const RANGE_END = new Date(2026, 0, 9);

const PROJECT_SEEDS = [
  {
    code: "PRJ001",
    name: "顧客管理システムリニューアル",
    abbreviation: "顧客管理",
    workType: WorkType.IN_PROGRESS,
    isKadminActive: true,
    wbs: ["要件定義", "基本設計", "詳細設計", "実装・テスト"],
  },
  {
    code: "PRJ002",
    name: "ECサイト新規構築",
    abbreviation: "ECサイト",
    workType: WorkType.IN_PROGRESS,
    isKadminActive: true,
    wbs: ["企画・調査", "UI/UX設計", "フロントエンド開発", "バックエンド開発"],
  },
  {
    code: "PRJ003",
    name: "社内業務システム改善",
    abbreviation: "社内システム",
    workType: WorkType.IN_PROGRESS,
    isKadminActive: true,
    wbs: ["現状分析", "改善提案", "開発", "運用保守"],
  },
  {
    code: "T2-001",
    name: "T2営業支援",
    abbreviation: "T2営業",
    workType: WorkType.SE_TRANSFER,
    isKadminActive: true,
    wbs: ["営業資料作成", "顧客対応", "提案準備"],
  },
  {
    code: "IND-001",
    name: "間接業務",
    abbreviation: "間接",
    workType: WorkType.INDIRECT,
    isKadminActive: true,
    wbs: ["社内ミーティング", "業務改善", "育成・教育"],
  },
];

const HOLIDAYS = [
  { date: "2025-04-29", name: "昭和の日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-05-03", name: "憲法記念日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-05-04", name: "みどりの日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-05-05", name: "こどもの日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-07-21", name: "海の日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-08-11", name: "山の日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-09-15", name: "敬老の日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-09-23", name: "秋分の日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-10-13", name: "スポーツの日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-11-03", name: "文化の日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-11-23", name: "勤労感謝の日", type: "PUBLIC_HOLIDAY" },
  { date: "2025-12-29", name: "年末休暇", type: "SPECIAL_HOLIDAY" },
  { date: "2025-12-30", name: "年末休暇", type: "SPECIAL_HOLIDAY" },
  { date: "2025-12-31", name: "年末休暇", type: "SPECIAL_HOLIDAY" },
  { date: "2026-01-01", name: "元日", type: "PUBLIC_HOLIDAY" },
  { date: "2026-01-02", name: "年始休暇", type: "SPECIAL_HOLIDAY" },
];

type ProjectSeed = (typeof PROJECT_SEEDS)[number];

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFiscalYear(year: number, month: number) {
  const fiscalYear = month >= 4 ? year : year - 1;
  const suffix = String(fiscalYear % 100).padStart(2, "0");
  return `FY${suffix}`;
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function pickNthWeekday(year: number, monthIndex: number, weekday: number, nth: number) {
  const start = startOfMonth(new Date(year, monthIndex));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  const matches = days.filter((day) => day.getDay() === weekday);
  return matches[nth - 1] || matches[matches.length - 1];
}

function buildWorkingDays(start: Date, end: Date, holidaySet: Set<string>) {
  return eachDayOfInterval({ start, end }).filter((day) => {
    if (isWeekend(day)) return false;
    return !holidaySet.has(dateKey(day));
  });
}

async function ensureProjects() {
  const created = [];
  for (const project of PROJECT_SEEDS) {
    const record = await prisma.project.upsert({
      where: { code: project.code },
      update: {
        name: project.name,
        abbreviation: project.abbreviation,
        workType: project.workType,
        isKadminActive: project.isKadminActive,
        isActive: true,
      },
      create: {
        code: project.code,
        name: project.name,
        abbreviation: project.abbreviation,
        workType: project.workType,
        isKadminActive: project.isKadminActive,
        isActive: true,
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

    created.push(record);
  }
  return created;
}

async function seedHolidays() {
  await prisma.holiday.deleteMany({
    where: {
      date: {
        gte: RANGE_START,
        lte: RANGE_END,
      },
    },
  });

  const holidayByDate = new Map<string, { date: string; name: string; type: string }>();
  for (const holiday of HOLIDAYS) {
    holidayByDate.set(holiday.date, holiday);
  }

  const allDays = eachDayOfInterval({ start: RANGE_START, end: RANGE_END });
  for (const day of allDays) {
    if (!isWeekend(day)) continue;
    const key = dateKey(day);
    if (holidayByDate.has(key)) continue;
    holidayByDate.set(key, {
      date: key,
      name: "週末",
      type: "WEEKEND",
    });
  }

  const holidays = Array.from(holidayByDate.values());
  if (!holidays.length) return new Set<string>();

  await prisma.holiday.createMany({
    data: holidays.map((holiday) => ({
      date: new Date(holiday.date),
      name: holiday.name,
      type: holiday.type,
      fiscalYear: getFiscalYear(
        new Date(holiday.date).getFullYear(),
        new Date(holiday.date).getMonth() + 1
      ),
    })),
  });

  return new Set(holidays.map((holiday) => holiday.date));
}

async function seedVacations(holidaySet: Set<string>) {
  await prisma.vacation.deleteMany({
    where: {
      date: {
        gte: RANGE_START,
        lte: RANGE_END,
      },
    },
  });

  const months = eachMonthOfInterval({ start: RANGE_START, end: RANGE_END });
  const vacations: Date[] = [];

  for (const monthStart of months) {
    const target = pickNthWeekday(
      monthStart.getFullYear(),
      monthStart.getMonth(),
      3,
      2
    );

    const withinRange =
      target >= RANGE_START && target <= RANGE_END ? target : monthStart;

    const dayKey = dateKey(withinRange);
    if (isWeekend(withinRange) || holidaySet.has(dayKey)) {
      const fallback = buildWorkingDays(
        startOfMonth(monthStart),
        endOfMonth(monthStart),
        holidaySet
      )[0];
      if (fallback && fallback >= RANGE_START && fallback <= RANGE_END) {
        vacations.push(fallback);
      }
    } else {
      vacations.push(withinRange);
    }
  }

  if (!vacations.length) return new Set<string>();

  await prisma.vacation.createMany({
    data: vacations.map((date) => ({
      date: startOfDay(date),
      type: "有給休暇",
      hours: 8,
      note: "ダミー有給",
    })),
  });

  return new Set(vacations.map((date) => dateKey(date)));
}

async function seedAttendance(workDays: Date[]) {
  await prisma.attendance.deleteMany({
    where: {
      date: {
        gte: RANGE_START,
        lte: RANGE_END,
      },
    },
  });

  for (const day of workDays) {
    const rand = createSeededRandom(hashString(dateKey(day)));
    const clockInHour = 8 + Math.floor(rand() * 2);
    const clockInMinute = 30 + Math.floor(rand() * 30);
    const clockOutHour = 17 + Math.floor(rand() * 2);
    const clockOutMinute = 30 + Math.floor(rand() * 30);

    const clockIn = new Date(day);
    clockIn.setHours(clockInHour, clockInMinute, 0, 0);

    const clockOut = new Date(day);
    clockOut.setHours(clockOutHour, clockOutMinute, 0, 0);

    await prisma.attendance.create({
      data: {
        date: startOfDay(day),
        clockIn,
        clockOut,
        breakMinutes: 60,
        workMode: rand() > 0.7 ? "Remote" : "Office",
        sleepHours: 6 + rand() * 2,
      },
    });
  }
}

async function seedDailyAndTimeEntries(
  workDays: Date[],
  projects: ProjectSeed[]
) {
  const projectRecords = await prisma.project.findMany({
    where: {
      code: { in: projects.map((project) => project.code) },
    },
    include: {
      wbsList: true,
    },
  });

  const projectMap = new Map(
    projectRecords.map((project) => [project.code, project])
  );

  await prisma.timeEntry.deleteMany({
    where: {
      startTime: {
        gte: RANGE_START,
        lte: RANGE_END,
      },
    },
  });

  await prisma.dailyTask.deleteMany({
    where: {
      date: {
        gte: RANGE_START,
        lte: RANGE_END,
      },
    },
  });

  for (const day of workDays) {
    const rand = createSeededRandom(hashString(dateKey(day)));
    const taskCount = 2 + Math.floor(rand() * 3);
    const totalMinutes = 8 * 60 - 60;
    let remainingMinutes = totalMinutes;
    let currentTime = new Date(day);
    currentTime.setHours(9, 0, 0, 0);
    let breakAdded = false;

    for (let i = 0; i < taskCount; i += 1) {
      if (!breakAdded && currentTime.getHours() >= 12) {
        currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000);
        breakAdded = true;
      }

      const minDuration = 60;
      const average = Math.floor(remainingMinutes / (taskCount - i));
      const maxDuration = Math.max(minDuration, average);
      const duration =
        i === taskCount - 1
          ? remainingMinutes
          : minDuration + Math.floor(rand() * (maxDuration - minDuration + 1));

      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + duration * 60 * 1000);
      currentTime = new Date(endTime);
      remainingMinutes -= duration;

      const projectSeed = projects[Math.floor(rand() * projects.length)];
      const project = projectMap.get(projectSeed.code);
      if (!project || !project.wbsList.length) continue;
      const wbs = project.wbsList[Math.floor(rand() * project.wbsList.length)];

      const dailyTask = await prisma.dailyTask.create({
        data: {
          date: startOfDay(day),
          title: `${project.abbreviation ?? project.name} - ${wbs.name}`,
          status: "DONE",
          priority: rand() > 0.7 ? "HIGH" : "MEDIUM",
          estimatedMinutes: duration,
        },
      });

      await prisma.timeEntry.create({
        data: {
          dailyTaskId: dailyTask.id,
          projectId: project.id,
          wbsId: wbs.id,
          startTime,
          endTime,
          duration: duration * 60,
          note: `${project.abbreviation ?? project.name} - ${wbs.name}`,
        },
      });
    }
  }
}

async function seedEvmFixedTasks(workDaysByMonth: Map<string, Date[]>) {
  await prisma.evmFixedTask.deleteMany({
    where: {
      date: {
        gte: RANGE_START,
        lte: RANGE_END,
      },
    },
  });

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  for (const [monthKey, days] of workDaysByMonth.entries()) {
    const [yearString, monthString] = monthKey.split("-");
    const year = parseInt(yearString, 10);
    const month = parseInt(monthString, 10);
    const sampleDays = days.filter((day) => day >= RANGE_START && day <= RANGE_END);
    const first = sampleDays[2] || sampleDays[0];
    const mid = sampleDays[Math.floor(sampleDays.length / 2)];

    for (const project of projects) {
      const baseMinutes = 90 + (project.code.length % 3) * 30;
      const targets = [first, mid].filter(Boolean);
      for (const target of targets) {
        if (!target) continue;
        await prisma.evmFixedTask.create({
          data: {
            date: startOfDay(target),
            projectId: project.id,
            title: `${project.name} 定例タスク`,
            estimatedMinutes: baseMinutes,
          },
        });
      }
    }

    await prisma.monthlyVacationHours.upsert({
      where: {
        fiscalYear_month: {
          fiscalYear: getFiscalYear(year, month),
          month,
        },
      },
      update: {
        hours: 8,
      },
      create: {
        fiscalYear: getFiscalYear(year, month),
        month,
        hours: 8,
      },
    });
  }
}

async function seedProjectWorkHours(workDaysByMonth: Map<string, Date[]>) {
  const projects = await prisma.project.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
  });

  for (const [monthKey, days] of workDaysByMonth.entries()) {
    const [yearString, monthString] = monthKey.split("-");
    const year = parseInt(yearString, 10);
    const month = parseInt(monthString, 10);
    const fiscalYear = getFiscalYear(year, month);
    const workingDays = days.length;

    for (const [index, project] of projects.entries()) {
      const basePerDay = 2.5 + (index % 3) * 0.5;
      const estimatedHours = Math.round(basePerDay * workingDays * 10) / 10;
      const variance = 0.9 + (index % 5) * 0.03;
      const actualHours = Math.round(estimatedHours * variance * 10) / 10;
      const overtimeHours = Math.max(0, Math.round((actualHours - estimatedHours) * 10) / 10);

      await prisma.projectWorkHours.upsert({
        where: {
          projectId_fiscalYear_month: {
            projectId: project.id,
            fiscalYear,
            month,
          },
        },
        update: {
          estimatedHours,
          actualHours,
          overtimeHours,
          workingDays,
          vacationHours: 8,
        },
        create: {
          projectId: project.id,
          fiscalYear,
          month,
          estimatedHours,
          actualHours,
          overtimeHours,
          workingDays,
          vacationHours: 8,
        },
      });
    }
  }
}

async function seedSalaryRecords() {
  const months = eachMonthOfInterval({ start: RANGE_START, end: RANGE_END });
  for (const monthStart of months) {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth() + 1;
    const baseGross = 420000 + (month % 3) * 15000;
    const healthInsurance = 21000;
    const pension = 36000;
    const employmentInsurance = 2400;
    const incomeTax = 18000 + (month % 2) * 1200;
    const residentTax = 16000;
    const otherDeductions = 5000;
    const bonus = month === 12 ? 120000 : 0;
    const totalDeductions =
      healthInsurance +
      pension +
      employmentInsurance +
      incomeTax +
      residentTax +
      otherDeductions;
    const net = baseGross - totalDeductions + bonus;

    await prisma.salaryRecord.upsert({
      where: {
        year_month: {
          year,
          month,
        },
      },
      update: {
        gross: baseGross,
        net,
        healthInsurance,
        pension,
        employmentInsurance,
        incomeTax,
        residentTax,
        otherDeductions,
        bonus,
      },
      create: {
        year,
        month,
        gross: baseGross,
        net,
        healthInsurance,
        pension,
        employmentInsurance,
        incomeTax,
        residentTax,
        otherDeductions,
        bonus,
      },
    });
  }
}

async function main() {
  console.log("🌱 Seeding dummy data (2025/04 - 2026/01/09)...");

  await ensureProjects();

  const holidaySet = await seedHolidays();
  const vacationSet = await seedVacations(holidaySet);

  const allWorkDays = buildWorkingDays(RANGE_START, RANGE_END, holidaySet).filter(
    (day) => !vacationSet.has(dateKey(day))
  );

  await seedAttendance(allWorkDays);
  await seedDailyAndTimeEntries(allWorkDays, PROJECT_SEEDS);

  const months = eachMonthOfInterval({ start: RANGE_START, end: RANGE_END });
  const workDaysByMonth = new Map<string, Date[]>();
  for (const monthStart of months) {
    const monthKey = format(monthStart, "yyyy-MM");
    const workingDays = buildWorkingDays(
      startOfMonth(monthStart),
      endOfMonth(monthStart),
      holidaySet
    ).filter((day) => day >= RANGE_START && day <= RANGE_END);
    workDaysByMonth.set(monthKey, workingDays);
  }

  await seedEvmFixedTasks(workDaysByMonth);
  await seedProjectWorkHours(workDaysByMonth);
  await seedSalaryRecords();

  console.log("✅ Dummy data seed complete.");
}

main()
  .catch((error) => {
    console.error("❌ Dummy seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

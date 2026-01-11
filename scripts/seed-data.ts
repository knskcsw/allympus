import { prisma } from '../src/lib/db';

// 平日判定（土日を除外）
function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0=日曜, 6=土曜
}

// 日付の範囲を生成
function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// ランダムな時間を生成（8:30-9:30の間）
function randomClockIn(): Date {
  const hour = 8;
  const minute = Math.floor(Math.random() * 60) + 30; // 30-89分
  const date = new Date();
  date.setHours(hour, minute >= 60 ? minute - 60 : minute, 0, 0);
  if (minute >= 60) date.setHours(9);
  return date;
}

// ランダムな退勤時間（17:30-19:30の間）
function randomClockOut(): Date {
  const hour = 17 + Math.floor(Math.random() * 2); // 17 or 18
  const minute = Math.floor(Math.random() * 60) + 30; // 30-89分
  const date = new Date();
  date.setHours(hour, minute >= 60 ? minute - 60 : minute, 0, 0);
  if (minute >= 60) date.setHours(hour + 1);
  return date;
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. プロジェクトを3つ作成
  console.log('📁 Creating projects...');
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        code: 'PRJ001',
        name: '顧客管理システムリニューアル',
        abbreviation: '顧客管理',
      },
    }),
    prisma.project.create({
      data: {
        code: 'PRJ002',
        name: 'ECサイト新規構築',
        abbreviation: 'ECサイト',
      },
    }),
    prisma.project.create({
      data: {
        code: 'PRJ003',
        name: '社内業務システム改善',
        abbreviation: '社内システム',
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  // 2. 各プロジェクトにWBSを4つずつ作成
  console.log('📋 Creating WBS items...');
  const wbsData = [
    ['要件定義', '基本設計', '詳細設計', '実装・テスト'],
    ['企画・調査', 'UI/UX設計', 'フロントエンド開発', 'バックエンド開発'],
    ['現状分析', '改善提案', '開発', '運用保守'],
  ];

  const allWbs: any[] = [];
  for (let i = 0; i < projects.length; i++) {
    for (let j = 0; j < 4; j++) {
      const wbs = await prisma.wbs.create({
        data: {
          projectId: projects[i].id,
          name: wbsData[i][j],
        },
      });
      allWbs.push(wbs);
    }
  }

  console.log(`✅ Created ${allWbs.length} WBS items`);

  // 3. 2025年12月と2026年1月の日付範囲を生成
  const dec2025Start = new Date('2025-12-01');
  const dec2025End = new Date('2025-12-31');
  const jan2026Start = new Date('2026-01-01');
  const jan2026End = new Date('2026-01-31');

  const allDates = [
    ...generateDateRange(dec2025Start, dec2025End),
    ...generateDateRange(jan2026Start, jan2026End),
  ];

  // 平日のみフィルタリング
  const weekdays = allDates.filter(isWeekday);

  console.log(`📅 Total weekdays: ${weekdays.length}`);

  // 4. 有給日を月1回程度ランダムに選択
  const dec2025Weekdays = weekdays.filter(
    (d) => d >= dec2025Start && d <= dec2025End
  );
  const jan2026Weekdays = weekdays.filter(
    (d) => d >= jan2026Start && d <= jan2026End
  );

  const vacationDates = [
    dec2025Weekdays[Math.floor(Math.random() * dec2025Weekdays.length)],
    jan2026Weekdays[Math.floor(Math.random() * jan2026Weekdays.length)],
  ];

  console.log('🏖️ Creating vacation records...');
  for (const vacDate of vacationDates) {
    await prisma.vacation.create({
      data: {
        date: vacDate,
        type: '有給休暇',
        hours: 8,
        note: '有給休暇',
      },
    });
  }

  console.log(`✅ Created ${vacationDates.length} vacation records`);

  // 5. 勤怠データを作成（有給日を除く）
  console.log('⏰ Creating attendance records...');
  const workDays = weekdays.filter(
    (d) => !vacationDates.some((vd) => vd.getTime() === d.getTime())
  );

  for (const date of workDays) {
    const clockIn = randomClockIn();
    const clockOut = randomClockOut();

    // 日付部分を設定
    clockIn.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    clockOut.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

    await prisma.attendance.create({
      data: {
        date: new Date(date.setHours(0, 0, 0, 0)),
        clockIn,
        clockOut,
        breakMinutes: 60, // 1時間休憩
      },
    });
  }

  console.log(`✅ Created ${workDays.length} attendance records`);

  // 6. 各作業日にデイリータスクとタイムエントリを作成
  console.log('⏱️ Creating daily tasks and time entries...');
  let timeEntryCount = 0;
  let dailyTaskCount = 0;

  for (const date of workDays) {
    const clockIn = randomClockIn();
    const clockOut = randomClockOut();
    clockIn.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    clockOut.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());

    const totalMinutes =
      (clockOut.getTime() - clockIn.getTime()) / (1000 * 60) - 60; // 休憩1時間を除く

    // その日の作業を2-4個のタスクに分割
    const numTasks = Math.floor(Math.random() * 3) + 2; // 2-4個
    let remainingMinutes = totalMinutes;
    const currentTime = new Date(clockIn);

    for (let i = 0; i < numTasks; i++) {
      const isLast = i === numTasks - 1;
      const duration = isLast
        ? remainingMinutes
        : Math.floor(Math.random() * (remainingMinutes / 2)) + 30;

      const startTime = new Date(currentTime);
      currentTime.setMinutes(currentTime.getMinutes() + duration);
      const endTime = new Date(currentTime);

      // ランダムにプロジェクトとWBSを選択
      const projectIndex = Math.floor(Math.random() * projects.length);
      const project = projects[projectIndex];
      const projectWbs = allWbs.filter((w) => w.projectId === project.id);
      const wbs = projectWbs[Math.floor(Math.random() * projectWbs.length)];

      // デイリータスクを作成
      const dailyTask = await prisma.dailyTask.create({
        data: {
          date: new Date(date.setHours(0, 0, 0, 0)),
          title: `${project.abbreviation} - ${wbs.name}`,
          status: 'DONE',
        },
      });
      dailyTaskCount++;

      // タイムエントリを作成（dailyTaskIdを関連付ける）
      await prisma.timeEntry.create({
        data: {
          dailyTaskId: dailyTask.id,
          projectId: project.id,
          wbsId: wbs.id,
          startTime,
          endTime,
          duration: Math.floor(duration * 60), // 分を秒に変換
          note: `${project.abbreviation} - ${wbs.name}`,
        },
      });

      timeEntryCount++;
      remainingMinutes -= duration;

      // 休憩時間を追加（12時頃に）
      if (currentTime.getHours() >= 12 && currentTime.getHours() < 13 && i < numTasks - 1) {
        currentTime.setMinutes(currentTime.getMinutes() + 60);
      }
    }
  }

  console.log(`✅ Created ${dailyTaskCount} daily tasks and ${timeEntryCount} time entries`);

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

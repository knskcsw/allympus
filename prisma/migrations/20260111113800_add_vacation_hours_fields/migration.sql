/*
  Warnings:

  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `taskId` on the `time_entries` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tasks";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "monthly_vacation_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fiscalYear" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "hours" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_project_work_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "estimatedHours" REAL NOT NULL DEFAULT 0,
    "actualHours" REAL NOT NULL DEFAULT 0,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "vacationHours" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_work_hours_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_project_work_hours" ("actualHours", "createdAt", "estimatedHours", "fiscalYear", "id", "month", "overtimeHours", "projectId", "updatedAt", "workingDays") SELECT "actualHours", "createdAt", "estimatedHours", "fiscalYear", "id", "month", "overtimeHours", "projectId", "updatedAt", "workingDays" FROM "project_work_hours";
DROP TABLE "project_work_hours";
ALTER TABLE "new_project_work_hours" RENAME TO "project_work_hours";
CREATE UNIQUE INDEX "project_work_hours_projectId_fiscalYear_month_key" ON "project_work_hours"("projectId", "fiscalYear", "month");
CREATE TABLE "new_time_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyTaskId" TEXT,
    "projectId" TEXT,
    "wbsId" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "time_entries_dailyTaskId_fkey" FOREIGN KEY ("dailyTaskId") REFERENCES "daily_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "time_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "time_entries_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "wbs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_time_entries" ("createdAt", "dailyTaskId", "duration", "endTime", "id", "note", "projectId", "startTime", "updatedAt", "wbsId") SELECT "createdAt", "dailyTaskId", "duration", "endTime", "id", "note", "projectId", "startTime", "updatedAt", "wbsId" FROM "time_entries";
DROP TABLE "time_entries";
ALTER TABLE "new_time_entries" RENAME TO "time_entries";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "holidays_date_key" ON "holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_vacation_hours_fiscalYear_month_key" ON "monthly_vacation_hours"("fiscalYear", "month");

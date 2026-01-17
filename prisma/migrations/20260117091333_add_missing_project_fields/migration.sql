-- CreateTable
CREATE TABLE "morning_routine_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "routine_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "abbreviation" TEXT,
    "workType" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isKadminActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "kadminSortOrder" INTEGER NOT NULL DEFAULT 0,
    "member" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_projects" ("abbreviation", "code", "createdAt", "id", "name", "updatedAt", "workType") SELECT "abbreviation", "code", "createdAt", "id", "name", "updatedAt", "workType" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");
CREATE INDEX "projects_isActive_idx" ON "projects"("isActive");
CREATE TABLE "new_time_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dailyTaskId" TEXT,
    "routineTaskId" TEXT,
    "projectId" TEXT,
    "wbsId" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "time_entries_dailyTaskId_fkey" FOREIGN KEY ("dailyTaskId") REFERENCES "daily_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "time_entries_routineTaskId_fkey" FOREIGN KEY ("routineTaskId") REFERENCES "routine_tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "time_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "time_entries_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "wbs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_time_entries" ("createdAt", "dailyTaskId", "duration", "endTime", "id", "note", "projectId", "startTime", "updatedAt", "wbsId") SELECT "createdAt", "dailyTaskId", "duration", "endTime", "id", "note", "projectId", "startTime", "updatedAt", "wbsId" FROM "time_entries";
DROP TABLE "time_entries";
ALTER TABLE "new_time_entries" RENAME TO "time_entries";
CREATE TABLE "new_wbs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wbsNo" TEXT,
    "wbsClass" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wbs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_wbs" ("createdAt", "id", "name", "projectId", "updatedAt") SELECT "createdAt", "id", "name", "projectId", "updatedAt" FROM "wbs";
DROP TABLE "wbs";
ALTER TABLE "new_wbs" RENAME TO "wbs";
CREATE INDEX "wbs_projectId_sortOrder_idx" ON "wbs"("projectId", "sortOrder");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "routine_tasks_sortOrder_idx" ON "routine_tasks"("sortOrder");

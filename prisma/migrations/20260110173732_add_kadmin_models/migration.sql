-- CreateTable
CREATE TABLE "project_work_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "estimatedHours" REAL NOT NULL DEFAULT 0,
    "actualHours" REAL NOT NULL DEFAULT 0,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "workingDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_work_hours_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vacations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "hours" REAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "project_work_hours_projectId_fiscalYear_month_key" ON "project_work_hours"("projectId", "fiscalYear", "month");

-- CreateIndex
CREATE UNIQUE INDEX "vacations_date_key" ON "vacations"("date");

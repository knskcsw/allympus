-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_daily_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedMinutes" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_daily_tasks" ("createdAt", "date", "description", "estimatedMinutes", "id", "priority", "status", "title", "updatedAt") SELECT "createdAt", "date", "description", "estimatedMinutes", "id", "priority", "status", "title", "updatedAt" FROM "daily_tasks";
DROP TABLE "daily_tasks";
ALTER TABLE "new_daily_tasks" RENAME TO "daily_tasks";
CREATE INDEX "daily_tasks_date_idx" ON "daily_tasks"("date");
CREATE INDEX "daily_tasks_status_idx" ON "daily_tasks"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

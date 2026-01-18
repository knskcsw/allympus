-- CreateTable
CREATE TABLE "work_schedule_template_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_schedule_template_applications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "work_schedule_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_work_schedule_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "weekdayMask" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_work_schedule_templates" ("createdAt", "id", "name", "sortOrder", "updatedAt") SELECT "createdAt", "id", "name", "sortOrder", "updatedAt" FROM "work_schedule_templates";
DROP TABLE "work_schedule_templates";
ALTER TABLE "new_work_schedule_templates" RENAME TO "work_schedule_templates";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "work_schedule_template_applications_date_idx" ON "work_schedule_template_applications"("date");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedule_template_applications_templateId_date_key" ON "work_schedule_template_applications"("templateId", "date");

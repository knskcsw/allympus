-- CreateTable
CREATE TABLE "work_schedule_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "work_schedule_template_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "projectId" TEXT,
    "wbsId" TEXT,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_schedule_template_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "work_schedule_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_schedule_template_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_schedule_template_items_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "wbs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "work_schedule_template_items_templateId_idx" ON "work_schedule_template_items"("templateId");

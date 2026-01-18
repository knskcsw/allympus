-- CreateTable
CREATE TABLE "work_schedule_template_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "wbsId" TEXT,
    "percentage" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_schedule_template_allocations_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "work_schedule_template_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_schedule_template_allocations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "work_schedule_template_allocations_wbsId_fkey" FOREIGN KEY ("wbsId") REFERENCES "wbs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "work_schedule_template_allocations_itemId_idx" ON "work_schedule_template_allocations"("itemId");

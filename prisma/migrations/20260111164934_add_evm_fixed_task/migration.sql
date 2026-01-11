-- CreateTable
CREATE TABLE "evm_fixed_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "evm_fixed_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "evm_fixed_tasks_date_idx" ON "evm_fixed_tasks"("date");

-- CreateIndex
CREATE INDEX "evm_fixed_tasks_projectId_idx" ON "evm_fixed_tasks"("projectId");

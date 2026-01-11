-- AlterTable
ALTER TABLE "attendances" ADD COLUMN "sleepHours" REAL;
ALTER TABLE "attendances" ADD COLUMN "workMode" TEXT;

-- CreateTable
CREATE TABLE "morning_routine_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "morning_routine_items_date_idx" ON "morning_routine_items"("date");

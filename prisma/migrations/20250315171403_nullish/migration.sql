/*
  Warnings:

  - A unique constraint covering the columns `[short]` on the table `Deck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[full]` on the table `Deck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[short]` on the table `Timeline` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[full]` on the table `Timeline` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Deck" DROP CONSTRAINT "Deck_userId_fkey";

-- DropForeignKey
ALTER TABLE "Timeline" DROP CONSTRAINT "Timeline_userId_fkey";

-- AlterTable
ALTER TABLE "Deck" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Timeline" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Deck_short_key" ON "Deck"("short");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_full_key" ON "Deck"("full");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_short_key" ON "Timeline"("short");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_full_key" ON "Timeline"("full");

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

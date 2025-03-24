/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Deck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[short,userId]` on the table `Deck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Timeline` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[short,userId]` on the table `Timeline` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `Deck` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Timeline` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Deck" DROP CONSTRAINT "Deck_userId_fkey";

-- DropForeignKey
ALTER TABLE "Timeline" DROP CONSTRAINT "Timeline_userId_fkey";

-- AlterTable
ALTER TABLE "Deck" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "userId" SET DEFAULT 'anonymous';

-- AlterTable
ALTER TABLE "Timeline" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "userId" SET DEFAULT 'anonymous';

-- CreateIndex
CREATE UNIQUE INDEX "Deck_userId_key" ON "Deck"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Deck_short_userId_key" ON "Deck"("short", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_userId_key" ON "Timeline"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Timeline_short_userId_key" ON "Timeline"("short", "userId");

-- AddForeignKey
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

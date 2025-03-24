-- DropIndex
DROP INDEX "Deck_full_key";

-- DropIndex
DROP INDEX "Deck_short_key";

-- DropIndex
DROP INDEX "Timeline_full_key";

-- DropIndex
DROP INDEX "Timeline_short_key";

-- AlterTable
ALTER TABLE "Deck" ALTER COLUMN "short" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Timeline" ALTER COLUMN "short" DROP NOT NULL;

-- Custom SQL migration file, put your code below! --
ALTER TABLE "memoria" ADD COLUMN "unique_id" uuid;
--> statement-breakpoint
UPDATE "memoria" SET "unique_id" = "id" WHERE "unique_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "memoria" ALTER COLUMN "unique_id" SET NOT NULL;

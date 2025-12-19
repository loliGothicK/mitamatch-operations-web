ALTER TABLE "user" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "deck" ADD COLUMN "title" varchar(255) DEFAULT 'no title' NOT NULL;--> statement-breakpoint
ALTER TABLE "timeline" ADD COLUMN "title" varchar(255) DEFAULT 'no title' NOT NULL;
ALTER TABLE "User" ALTER COLUMN "id" SET DATA TYPE varchar(24);--> statement-breakpoint
ALTER TABLE "Deck" ALTER COLUMN "id" SET DATA TYPE varchar(24);--> statement-breakpoint
ALTER TABLE "Timeline" ALTER COLUMN "id" SET DATA TYPE varchar(24);--> statement-breakpoint
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_short_unique" UNIQUE("short");--> statement-breakpoint
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_short_unique" UNIQUE("short");
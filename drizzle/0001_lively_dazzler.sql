CREATE TABLE "users" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"discordId" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar" text DEFAULT 'default' NOT NULL,
    "accessToken" text NOT NULL,
    "refreshToken" text NOT NULL,
	"createdAt" date DEFAULT now(),
	CONSTRAINT "users_discordId_unique" UNIQUE("discordId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "decks" ALTER COLUMN "full" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "decks" ALTER COLUMN "short" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "timelines" ALTER COLUMN "full" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "timelines" ALTER COLUMN "short" SET NOT NULL;
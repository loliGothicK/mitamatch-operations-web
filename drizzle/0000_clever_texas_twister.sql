CREATE TABLE "decks" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"full" text,
	"short" text,
	"createdAt" date DEFAULT now(),
	CONSTRAINT "decks_full_unique" UNIQUE("full"),
	CONSTRAINT "decks_short_unique" UNIQUE("short")
);
--> statement-breakpoint
CREATE TABLE "timelines" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"full" text,
	"short" text,
	"createdAt" date DEFAULT now(),
	CONSTRAINT "timelines_full_unique" UNIQUE("full"),
	CONSTRAINT "timelines_short_unique" UNIQUE("short")
);

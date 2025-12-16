CREATE TABLE "order" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"effect" text NOT NULL,
	"description" text NOT NULL,
	"prepare_time" integer NOT NULL,
	"effect_time" integer NOT NULL,
	"usually" boolean NOT NULL
);
--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "cost" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "atk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "spatk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "def" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "spdef" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "questSkill" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "gvgSkill" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "memoria" ADD COLUMN "autoSkill" jsonb NOT NULL;
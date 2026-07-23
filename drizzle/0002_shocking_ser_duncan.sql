CREATE TABLE "legion_deck" (
	"id" uuid PRIMARY KEY NOT NULL,
	"legion_id" uuid NOT NULL,
	"user_id" uuid,
	"title" varchar(255) DEFAULT 'no title' NOT NULL,
	"short" uuid NOT NULL,
	"unit" jsonb NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	CONSTRAINT "legion_deck_short_unique" UNIQUE("short")
);
--> statement-breakpoint
CREATE TABLE "legion_timeline" (
	"id" uuid PRIMARY KEY NOT NULL,
	"legion_id" uuid NOT NULL,
	"user_id" uuid,
	"title" varchar(255) DEFAULT 'no title' NOT NULL,
	"short" uuid,
	"timeline" jsonb NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	CONSTRAINT "legion_timeline_short_unique" UNIQUE("short")
);
--> statement-breakpoint
ALTER TABLE "legion_deck" ADD CONSTRAINT "legion_deck_legion_id_organization_id_fk" FOREIGN KEY ("legion_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legion_deck" ADD CONSTRAINT "legion_deck_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legion_timeline" ADD CONSTRAINT "legion_timeline_legion_id_organization_id_fk" FOREIGN KEY ("legion_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legion_timeline" ADD CONSTRAINT "legion_timeline_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
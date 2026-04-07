CREATE TABLE "query_preset" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"title" varchar(255) NOT NULL,
	"query" varchar(10000) NOT NULL,
	"owned_only" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck" ALTER COLUMN "short" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "query_preset" ADD CONSTRAINT "query_preset_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
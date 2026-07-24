CREATE TABLE IF NOT EXISTS "organization_invites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS "legion_deck" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "legion_timeline" CASCADE;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organization_invites_organization_id_organization_id_fk'
  ) THEN
    ALTER TABLE "organization_invites"
      ADD CONSTRAINT "organization_invites_organization_id_organization_id_fk"
      FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organization_invites_user_id_user_id_fk'
  ) THEN
    ALTER TABLE "organization_invites"
      ADD CONSTRAINT "organization_invites_user_id_user_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."user"("id")
      ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

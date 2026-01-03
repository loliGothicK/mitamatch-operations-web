CREATE TABLE "deck" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"title" varchar(255) DEFAULT 'no title' NOT NULL,
	"short" uuid,
	"unit" jsonb NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	CONSTRAINT "deck_short_unique" UNIQUE("short")
);
--> statement-breakpoint
CREATE TABLE "memoria" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(255) DEFAULT 'org:member' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timeline" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"title" varchar(255) DEFAULT 'no title' NOT NULL,
	"short" uuid,
	"timeline" jsonb NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	CONSTRAINT "timeline_short_unique" UNIQUE("short")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255) DEFAULT 'org:member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "user_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "users_to_memoria" (
	"user_id" uuid NOT NULL,
	"memoria_id" uuid NOT NULL,
	"limit_break" integer DEFAULT 0 NOT NULL,
	"acquired_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_to_memoria_user_id_memoria_id_pk" PRIMARY KEY("user_id","memoria_id")
);
--> statement-breakpoint
CREATE TABLE "users_to_order" (
	"user_id" uuid NOT NULL,
	"order_id" integer NOT NULL,
	CONSTRAINT "users_to_order_user_id_order_id_pk" PRIMARY KEY("user_id","order_id")
);
--> statement-breakpoint
ALTER TABLE "deck" ADD CONSTRAINT "deck_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline" ADD CONSTRAINT "timeline_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_memoria" ADD CONSTRAINT "users_to_memoria_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_memoria" ADD CONSTRAINT "users_to_memoria_memoria_id_memoria_id_fk" FOREIGN KEY ("memoria_id") REFERENCES "public"."memoria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_order" ADD CONSTRAINT "users_to_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_order" ADD CONSTRAINT "users_to_order_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clerk_user_id_idx" ON "user" USING btree ("clerk_user_id");
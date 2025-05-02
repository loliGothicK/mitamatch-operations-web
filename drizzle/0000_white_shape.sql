CREATE TABLE "User" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"discordId" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text DEFAULT 'default' NOT NULL,
	"accessToken" text NOT NULL,
	"refreshToken" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
CREATE TABLE "Deck" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"userId" text,
	"short" text,
	"full" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	CONSTRAINT "check_either" CHECK (("userId" IS NOT NULL) OR (short IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "Timeline" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"userId" text,
	"short" text,
	"full" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	CONSTRAINT "check_either" CHECK (("userId" IS NOT NULL) OR (short IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Timeline" ADD CONSTRAINT "Timeline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "User_discordId_key" ON "User" USING btree ("discordId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Deck_userId_key" ON "Deck" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Timeline_userId_key" ON "Timeline" USING btree ("userId" text_ops);

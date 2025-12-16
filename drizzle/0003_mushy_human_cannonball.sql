CREATE TABLE "orders_to_memoria" (
	"user_id" uuid NOT NULL,
	"order_id" integer NOT NULL,
	CONSTRAINT "orders_to_memoria_user_id_order_id_pk" PRIMARY KEY("user_id","order_id")
);
--> statement-breakpoint
ALTER TABLE "orders_to_memoria" ADD CONSTRAINT "orders_to_memoria_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders_to_memoria" ADD CONSTRAINT "orders_to_memoria_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;
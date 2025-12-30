ALTER TABLE "orders_to_memoria" RENAME TO "users_to_order";--> statement-breakpoint
ALTER TABLE "users_to_order" DROP CONSTRAINT "orders_to_memoria_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_order" DROP CONSTRAINT "orders_to_memoria_order_id_order_id_fk";
--> statement-breakpoint
ALTER TABLE "users_to_order" DROP CONSTRAINT "orders_to_memoria_user_id_order_id_pk";--> statement-breakpoint
ALTER TABLE "users_to_order" ADD CONSTRAINT "users_to_order_user_id_order_id_pk" PRIMARY KEY("user_id","order_id");--> statement-breakpoint
ALTER TABLE "users_to_order" ADD CONSTRAINT "users_to_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_to_order" ADD CONSTRAINT "users_to_order_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;
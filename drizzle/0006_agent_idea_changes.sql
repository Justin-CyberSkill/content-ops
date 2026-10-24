CREATE TYPE "public"."content_event_action" AS ENUM('proposed', 'updated', 'withdrawn', 'restored', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "content_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"action" "content_event_action" NOT NULL,
	"agent_key_id" text,
	"user_id" text,
	"actor_name" text NOT NULL,
	"fields" text[] DEFAULT '{}' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "withdrawn_at" timestamp;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "withdraw_reason" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "sources" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "content_event" ADD CONSTRAINT "content_event_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_event" ADD CONSTRAINT "content_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_event_content_id_idx" ON "content_event" USING btree ("content_id");
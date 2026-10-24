CREATE TYPE "public"."content_status" AS ENUM('proposed', 'planned', 'in_progress', 'in_review', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('motion_video', 'short_video', 'long_video', 'live', 'image', 'carousel', 'text_post', 'quiz', 'article');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'threads', 'website');--> statement-breakpoint
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal" text NOT NULL,
	"idea" text NOT NULL,
	"platforms" "platform"[] DEFAULT '{}' NOT NULL,
	"type" "content_type" NOT NULL,
	"publish_date" date,
	"golden_time" time,
	"assignee_id" text,
	"status" "content_status" DEFAULT 'planned' NOT NULL,
	"asset_links" text[] DEFAULT '{}' NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_assignee_id_idx" ON "content" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "content_publish_date_idx" ON "content" USING btree ("publish_date");
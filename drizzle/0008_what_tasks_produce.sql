CREATE TYPE "public"."review_verdict" AS ENUM('approved', 'changes_requested');--> statement-breakpoint
CREATE TABLE "asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"label" text NOT NULL,
	"platform" "platform",
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"url" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"hashtags" text DEFAULT '' NOT NULL,
	"pinned_comment" text DEFAULT '' NOT NULL,
	"copy_updated_at" timestamp,
	"copy_updated_by_id" text,
	"live_url" text,
	"published_at" timestamp,
	"published_by_id" text
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"verdict" "review_verdict" NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"reopened_tasks" text[] DEFAULT '{}' NOT NULL,
	"reviewer_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "script" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "script_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "reopened_by_review_id" uuid;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_version" ADD CONSTRAINT "asset_version_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_version" ADD CONSTRAINT "asset_version_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_copy_updated_by_id_user_id_fk" FOREIGN KEY ("copy_updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_published_by_id_user_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_content_id_idx" ON "asset" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "asset_version_asset_id_idx" ON "asset_version" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_content_platform_idx" ON "post" USING btree ("content_id","platform");--> statement-breakpoint
CREATE INDEX "review_content_id_idx" ON "review" USING btree ("content_id");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_reopened_by_review_id_review_id_fk" FOREIGN KEY ("reopened_by_review_id") REFERENCES "public"."review"("id") ON DELETE set null ON UPDATE no action;
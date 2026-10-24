CREATE TYPE "public"."task_status" AS ENUM('waiting', 'todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TABLE "member_work_type" (
	"user_id" text NOT NULL,
	"work_type_id" uuid NOT NULL,
	CONSTRAINT "member_work_type_user_id_work_type_id_pk" PRIMARY KEY("user_id","work_type_id")
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"work_type_id" uuid,
	"name" text NOT NULL,
	"idea_status" "content_status" NOT NULL,
	"position" integer NOT NULL,
	"days_before" integer DEFAULT 0 NOT NULL,
	"assignee_id" text,
	"status" "task_status" DEFAULT 'waiting' NOT NULL,
	"due_date" date,
	"done_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"idea_status" "content_status" DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_step" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" "content_type" NOT NULL,
	"work_type_id" uuid NOT NULL,
	"days_before" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_work_type" ADD CONSTRAINT "member_work_type_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_work_type" ADD CONSTRAINT "member_work_type_work_type_id_work_type_id_fk" FOREIGN KEY ("work_type_id") REFERENCES "public"."work_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_work_type_id_work_type_id_fk" FOREIGN KEY ("work_type_id") REFERENCES "public"."work_type"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_step" ADD CONSTRAINT "workflow_step_work_type_id_work_type_id_fk" FOREIGN KEY ("work_type_id") REFERENCES "public"."work_type"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_content_id_idx" ON "task" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "task_assignee_id_idx" ON "task" USING btree ("assignee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_step_type_work_idx" ON "workflow_step" USING btree ("content_type","work_type_id");--> statement-breakpoint
-- A starting workflow, so approving makes tasks before anyone sets it up. Admins change it under Members > Workflow.
INSERT INTO "work_type" ("name", "position", "idea_status") VALUES
  ('Content prep', 0, 'in_progress'),
  ('Asset prep', 1, 'in_progress'),
  ('Review', 2, 'in_review'),
  ('Publishing', 3, 'scheduled');--> statement-breakpoint
-- Every content type needs every kind of work, except text posts and articles, which have no assets to make.
INSERT INTO "workflow_step" ("content_type", "work_type_id", "days_before")
SELECT ct, wt."id",
  CASE wt."name" WHEN 'Content prep' THEN 5 WHEN 'Asset prep' THEN 3 WHEN 'Review' THEN 1 ELSE 0 END
FROM unnest(enum_range(NULL::"content_type")) AS ct
CROSS JOIN "work_type" wt
WHERE NOT (ct IN ('text_post', 'article') AND wt."name" = 'Asset prep');--> statement-breakpoint
-- Admins review and publish today. Who prepares content and assets is set by hand.
INSERT INTO "member_work_type" ("user_id", "work_type_id")
SELECT u."id", wt."id"
FROM "user" u
CROSS JOIN "work_type" wt
WHERE u."role" = 'admin' AND wt."name" IN ('Review', 'Publishing');

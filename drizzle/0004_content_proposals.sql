ALTER TABLE "content" ADD COLUMN "proposed_by_key_id" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "proposed_by_name" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "proposal_reason" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "reviewed_by_id" text;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_reviewed_by_id_user_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_proposed_by_key_id_idx" ON "content" USING btree ("proposed_by_key_id");
CREATE TYPE "billing_record_kind" AS ENUM('customers', 'products', 'invoices', 'payments');--> statement-breakpoint
CREATE TABLE "billing_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL,
	"kind" "billing_record_kind" NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_workspaces" (
	"user_id" text PRIMARY KEY,
	"profile" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "billing_records_owner_kind_idx" ON "billing_records" ("user_id","kind");--> statement-breakpoint
ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_user_id_billing_workspaces_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "billing_workspaces"("user_id") ON DELETE CASCADE;
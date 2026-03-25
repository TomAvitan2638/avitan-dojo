-- Add new columns to students table
ALTER TABLE "students" ADD COLUMN "identifier" TEXT;
ALTER TABLE "students" ADD COLUMN "parent_name" TEXT;
ALTER TABLE "students" ADD COLUMN "parent_phone" TEXT;
ALTER TABLE "students" ADD COLUMN "emergency_details" TEXT;

-- Backfill identifier for existing rows (use id as unique placeholder)
UPDATE "students" SET "identifier" = "id" WHERE "identifier" IS NULL;

-- Make identifier required and unique
ALTER TABLE "students" ALTER COLUMN "identifier" SET NOT NULL;
CREATE UNIQUE INDEX "students_identifier_key" ON "students"("identifier");

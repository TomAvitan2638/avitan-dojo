-- Align database with prisma/schema.prisma after historical drift.
-- Adds payment redesign (PaymentMonth, PaymentEquipmentItem, payment columns + enums),
-- student/instructor fields, nullable membership end_date, and system catalog tables.

-- ---------------------------------------------------------------------------
-- New enums
-- ---------------------------------------------------------------------------
CREATE TYPE "PaymentType" AS ENUM ('MONTHLY', 'EQUIPMENT', 'EXAM');

CREATE TYPE "MonthlyPaymentSubtype" AS ENUM ('REGULAR', 'CHECK', 'WAIVER');

-- ---------------------------------------------------------------------------
-- Extend PaymentMethod (existing enum from initial migration)
-- ---------------------------------------------------------------------------
ALTER TYPE "PaymentMethod" ADD VALUE 'bit';
ALTER TYPE "PaymentMethod" ADD VALUE 'paybox';

-- ---------------------------------------------------------------------------
-- instructors: photo_url, is_active
-- ---------------------------------------------------------------------------
ALTER TABLE "instructors" ADD COLUMN "photo_url" TEXT;
ALTER TABLE "instructors" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- students: optional catalogue + contact fields
-- ---------------------------------------------------------------------------
ALTER TABLE "students" ADD COLUMN "student_number" INTEGER;
ALTER TABLE "students" ADD COLUMN "mobile_phone" TEXT;
ALTER TABLE "students" ADD COLUMN "street" TEXT;
ALTER TABLE "students" ADD COLUMN "postal_code" TEXT;
ALTER TABLE "students" ADD COLUMN "has_medical_approval" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "students_student_number_key" ON "students"("student_number");

-- ---------------------------------------------------------------------------
-- student_memberships: end_date nullable (per schema)
-- ---------------------------------------------------------------------------
ALTER TABLE "student_memberships" ALTER COLUMN "end_date" DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- payments: types, snapshots, monthly/equipment/exam fields, nullable method, updated_at
-- ---------------------------------------------------------------------------
ALTER TABLE "payments" ADD COLUMN "payment_type" "PaymentType";
ALTER TABLE "payments" ALTER COLUMN "payment_method" DROP NOT NULL;
ALTER TABLE "payments" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "payments" ADD COLUMN "student_identifier_snapshot" TEXT;
ALTER TABLE "payments" ADD COLUMN "student_name_snapshot" TEXT;
ALTER TABLE "payments" ADD COLUMN "center_id_snapshot" TEXT;
ALTER TABLE "payments" ADD COLUMN "center_name_snapshot" TEXT;
ALTER TABLE "payments" ADD COLUMN "group_id_snapshot" TEXT;
ALTER TABLE "payments" ADD COLUMN "group_name_snapshot" TEXT;
ALTER TABLE "payments" ADD COLUMN "monthly_subtype" "MonthlyPaymentSubtype";
ALTER TABLE "payments" ADD COLUMN "bank_number" TEXT;
ALTER TABLE "payments" ADD COLUMN "check_number" TEXT;
ALTER TABLE "payments" ADD COLUMN "waiver_reason" TEXT;
ALTER TABLE "payments" ADD COLUMN "equipment_notes" TEXT;
ALTER TABLE "payments" ADD COLUMN "exam_date" DATE;
ALTER TABLE "payments" ADD COLUMN "exam_code" TEXT;

CREATE INDEX "payments_payment_type_idx" ON "payments"("payment_type");

-- ---------------------------------------------------------------------------
-- payment_months (child of payments)
-- ---------------------------------------------------------------------------
CREATE TABLE "payment_months" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,

    CONSTRAINT "payment_months_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_months_payment_id_year_month_key" ON "payment_months"("payment_id", "year", "month");
CREATE INDEX "payment_months_payment_id_idx" ON "payment_months"("payment_id");
CREATE INDEX "payment_months_year_month_idx" ON "payment_months"("year", "month");

ALTER TABLE "payment_months" ADD CONSTRAINT "payment_months_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- payment_equipment_items (child of payments)
-- ---------------------------------------------------------------------------
CREATE TABLE "payment_equipment_items" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "equipment_code" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_amount_snapshot" DECIMAL(10,2),

    CONSTRAINT "payment_equipment_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_equipment_items_payment_id_idx" ON "payment_equipment_items"("payment_id");
CREATE INDEX "payment_equipment_items_equipment_code_idx" ON "payment_equipment_items"("equipment_code");

ALTER TABLE "payment_equipment_items" ADD CONSTRAINT "payment_equipment_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- sports_equipment (system catalog)
-- ---------------------------------------------------------------------------
CREATE TABLE "sports_equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_equipment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sports_equipment_code_key" ON "sports_equipment"("code");
CREATE INDEX "sports_equipment_code_idx" ON "sports_equipment"("code");

-- ---------------------------------------------------------------------------
-- exams (system catalog)
-- ---------------------------------------------------------------------------
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "exams_code_key" ON "exams"("code");
CREATE INDEX "exams_code_idx" ON "exams"("code");

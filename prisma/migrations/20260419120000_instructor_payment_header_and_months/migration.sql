-- Replace legacy one-row-per-month coach payments with header + child month rows.
-- Safe: no production coach payment data to preserve.

DROP TABLE IF EXISTS "instructor_payments" CASCADE;

CREATE TABLE "instructor_payments" (
    "id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "instructor_payment_months" (
    "id" TEXT NOT NULL,
    "instructor_payment_id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,

    CONSTRAINT "instructor_payment_months_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "instructor_payment_months_instructor_payment_id_year_month_key" ON "instructor_payment_months"("instructor_payment_id", "year", "month");

CREATE UNIQUE INDEX "instructor_payment_months_instructor_id_year_month_key" ON "instructor_payment_months"("instructor_id", "year", "month");

CREATE INDEX "instructor_payments_instructor_id_idx" ON "instructor_payments"("instructor_id");

CREATE INDEX "instructor_payments_payment_date_idx" ON "instructor_payments"("payment_date");

CREATE INDEX "instructor_payment_months_instructor_id_idx" ON "instructor_payment_months"("instructor_id");

CREATE INDEX "instructor_payment_months_year_month_idx" ON "instructor_payment_months"("year", "month");

ALTER TABLE "instructor_payments" ADD CONSTRAINT "instructor_payments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "instructor_payment_months" ADD CONSTRAINT "instructor_payment_months_instructor_payment_id_fkey" FOREIGN KEY ("instructor_payment_id") REFERENCES "instructor_payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "instructor_payment_months" ADD CONSTRAINT "instructor_payment_months_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

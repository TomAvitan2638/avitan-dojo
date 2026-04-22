-- CreateTable
CREATE TABLE "instructor_payments" (
    "id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "coverage_year" INTEGER NOT NULL,
    "coverage_month" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instructor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "instructor_payments_instructor_id_idx" ON "instructor_payments"("instructor_id");

-- CreateIndex
CREATE INDEX "instructor_payments_coverage_year_coverage_month_idx" ON "instructor_payments"("coverage_year", "coverage_month");

-- CreateUniqueConstraint
CREATE UNIQUE INDEX "instructor_payments_instructor_id_coverage_year_coverage_month_key" ON "instructor_payments"("instructor_id", "coverage_year", "coverage_month");

-- AddForeignKey
ALTER TABLE "instructor_payments" ADD CONSTRAINT "instructor_payments_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "instructors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

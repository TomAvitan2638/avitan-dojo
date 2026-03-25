# Fake Data Generation Plan for Avitan Dojo Load Testing

## 1. Implemented Fake-Data Strategy

**Approach**: Standalone script, deterministic, append-only

- **File**: `scripts/seed-fake-load-data.ts`
- **Execution**: `npm run db:seed-fake-load`
- **Deterministic**: Seeded mulberry32 PRNG (seed 42) for reproducible data
- **Student identifiers**: Numeric-only, e.g. `900000001`, `900000002` (safe range)
- **Mode**: Append only — no reset/cleanup logic
- **Batching**: Batches of 100 for students/memberships; 50 payments per transaction
- **Intended for**: Dev/test databases only

**Target volumes**:

| Entity             | Count   | Notes                                       |
|--------------------|---------|---------------------------------------------|
| Students           | 500     | Identifiers 900000001–900000500             |
| Centers            | 20      |                                             |
| Groups             | 50      | 2–3 per center                              |
| Instructors        | 25      |                                             |
| SportsEquipment    | 18      | Codes LOAD-EQ-01 … LOAD-EQ-18               |
| Exam               | 10      | Codes LOAD-EX-01 … LOAD-EX-10               |
| Memberships        | ~530+   | Mix of active, expired, cancelled           |
| Belt history       | 250     |                                             |
| Payments           | 1700    | 1000 MONTHLY, 400 EQUIPMENT, 300 EXAM       |

---

## 2. Insert Order / Dependency Order

| Phase | Entity                | Depends On         | Notes                                   |
|-------|------------------------|-------------------|-----------------------------------------|
| 1     | BeltLevel              | —                 | Requires main seed first                 |
| 2     | SportsEquipment        | —                 | LOAD-EQ-* codes if none exist           |
| 3     | Exam                   | —                 | LOAD-EX-* codes if none exist           |
| 4     | Instructor             | —                 |                                         |
| 5     | Center                 | Instructor        |                                         |
| 6     | Group                  | Center, Instructor|                                         |
| 7     | GroupSchedule          | Group             |                                         |
| 8     | Student                | —                 | Batched createMany                      |
| 9     | StudentMembership      | Student, Group    | Active/expired/cancelled mix             |
| 10    | StudentBeltHistory     | Student, BeltLevel|                                         |
| 11a   | Payment + PaymentMonth | Student, Membership | MONTHLY: create Payment, then createMany PaymentMonth |
| 11b   | Payment + PaymentEquipmentItem | Student, SportsEquipment | EQUIPMENT: create Payment, then createMany PaymentEquipmentItem |
| 11c   | Payment                | Student, Exam     | EXAM: create Payment only (no children) |

**Payment creation (explicit parent-child)**:

- **MONTHLY**: Create `Payment` with `paymentType`, `monthlySubtype`, `membershipId`, snapshots; then `PaymentMonth.createMany` with year/month rows.
- **EQUIPMENT**: Create `Payment` with `paymentType`; then `PaymentEquipmentItem.createMany` with valid `equipmentCode` from SportsEquipment.
- **EXAM**: Create `Payment` with `paymentType`, `examCode`, `examDate` from Exam table (no child rows).

---

## 3. Append Only (No Reset/Cleanup)

- **Append only**: Inserts only; never deletes.
- **Re-run guard**: If student with identifier `900000001` exists, script exits (already seeded).
- **Reset/cleanup**: Not implemented; can be added later if needed.

---

## 4. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Overwriting real data | Numeric identifiers in 900M range; dev/test only |
| Duplicate identifier | Guard: exit if 900000001 exists |
| Long execution time | Batching (100 students, 50 payments per tx) |
| Partial failure | Small transaction scopes; roll back on error |
| FK violations | System data created first; only valid codes used |
| MONTHLY without membership | Only active memberships used for MONTHLY |

---

## 5. Files

| File | Purpose |
|------|---------|
| `scripts/seed-fake-load-data.ts` | Main script |
| `package.json` | `db:seed-fake-load` script |

---

## 6. How to Run

1. **Environment**: Ensure `DATABASE_URL` points to a dev/test database.
2. **Prerequisite**: Run main seed first if BeltLevel is empty: `npm run db:seed`
3. **Run**: `npm run db:seed-fake-load`
4. **Re-run**: If fake data exists (900000001), script exits without changes.

---

## 7. Assumptions (Resolved)

1. **Database**: Dev/test only — do not run on production or important data.
2. **User records**: Not created for instructors.
3. **BeltLevel**: Script requires BeltLevels from main seed.
4. **Identifier format**: Numeric `900000001` … `900000500`.
5. **StudentNumber**: Same range as identifier (900000001+).
6. **Cleanup**: Not implemented; append-only for now.

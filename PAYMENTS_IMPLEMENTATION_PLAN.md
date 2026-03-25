# Payments Module – Implementation Plan

## 1. Requirement Understanding

**Purpose:** Record all dojo payments, link them to students, support multiple payment types, preserve structured history for analytics, and use System Data for equipment and exam references.

**Main payment types:**

1. **Monthly** – 3 subtypes:
   - Regular: amount, date, months, method (Bit, Paybox, Cash, Bank transfer)
   - Check: amount, date, months, bank number, check number
   - Waiver (פטור מתשלום): date, months, reason (free text), amount = 0

2. **Equipment** – amount, date, items from Sports Equipment (multiple items with quantity), notes, total amount only

3. **Exam** – amount, date, exam date, one exam type from Exams list

**Constraints:**
- Payment months stored as structured month/year records (queryable)
- Center/group snapshots captured at payment time
- Equipment and exams referenced by code from System Data
- No delete/edit in v1
- No receipts, partial payments, multiple checks, billing engine, reminders, reports, approvals, or external integrations

---

## 2. Proposed Data Model

### 2.1 Enum changes

**PaymentMethod** – Extend existing enum, do NOT remove legacy values:
- Add: `bit`, `paybox`
- Keep: `cash`, `credit_card`, `check`, `bank_transfer` (existing)

**New enums:**
- PaymentType: MONTHLY | EQUIPMENT | EXAM
- MonthlyPaymentSubtype: REGULAR | CHECK | WAIVER

### 2.2 Main Payment table

- id, studentId, paymentType, paymentDate, amount, createdAt, updatedAt

**Snapshots** (explicit ID + name when available):
- studentIdentifierSnapshot, studentNameSnapshot
- centerIdSnapshot (nullable)
- centerNameSnapshot (nullable)
- groupIdSnapshot (nullable)
- groupNameSnapshot (nullable)

**Type-specific fields:**
- Monthly: monthlySubtype, paymentMethod, bankNumber, checkNumber, waiverReason
- Equipment: equipmentNotes
- Exam: examDate, examCode (references Exam.code)

**References:**
- membershipId (optional; v1 flow must not depend on it)
- equipmentCode / examCode: business-code linkage per System Data

### 2.3 PaymentMonth (child)

- id, paymentId, year, month (1–12)
- Unique (paymentId, year, month)
- Index on (year, month) for queries

### 2.4 PaymentEquipmentItem (child)

- id, paymentId, equipmentCode, quantity
- equipmentCode references SportsEquipment.code

---

## 3. Key Business Logic Decisions

| Decision | Approach |
|----------|----------|
| PaymentMethod | Extend enum with bit, paybox; keep all legacy values; do not break old data |
| System Data linkage | Use business-code linkage (equipmentCode, examCode); do NOT use ID-based linkage |
| Monthly months | PaymentMonth table; structured (year, month) |
| Waiver | Same Payment record, amount=0, waiverReason stored |
| Equipment items | PaymentEquipmentItem by equipmentCode; multiple per payment |
| Exam | examCode on Payment; one exam per payment |
| Snapshots | Store centerIdSnapshot, centerNameSnapshot, groupIdSnapshot, groupNameSnapshot (plus student identifier/name) |
| membershipId | Optional only; v1 flow must not depend on it |
| Payment timestamps | Include updatedAt on Payment |

### 3.1 Student without active membership

| Payment type | Allowed without membership? | Center/group snapshot |
|--------------|-----------------------------|------------------------|
| Monthly | No – requires active membership | From active membership |
| Equipment | Yes | Empty/null if no active membership |
| Exam | Yes | Empty/null if no active membership |

Rule: Do NOT use "last known" center/group. If no active membership, store center/group snapshots as empty/null.

---

## 4. Open Questions / Risks

1. Migration of existing Payment records (legacy structure)
2. Record-payment page: keep or fold into new flow

---

## 5. Proposed UI Structure

- Main table: date, student ID, name, center, group, type, amount; newest first
- Create flow: type → subtype (if monthly) → dynamic form
- Month selector: multi-select for year+month
- Equipment: add items from Sports Equipment with quantity
- Payment details: read-only view with all fields

---

## 6. Proposed Files / Routes

- `src/app/(dashboard)/dashboard/payments/page.tsx`
- `src/app/(dashboard)/dashboard/payments/payments-page-client.tsx`
- `src/app/(dashboard)/dashboard/payments/[id]/page.tsx` (details)
- `src/server/actions/create-payment.ts`
- `src/components/payments/create-payment-dialog.tsx`
- `src/components/payments/payment-type-form.tsx`
- `src/lib/payment-types.ts`

---

## 7. Validation Rules

- Student required
- Amount >= 0 (0 for waiver)
- Monthly: student MUST have active membership
- Equipment/Exam: allowed without active membership
- At least one month for monthly
- Payment method for regular monthly
- Bank + check for check monthly
- At least one equipment item for equipment
- Exam type required for exam
- Exam/equipment codes must exist in System Data

---

## 8. Implementation Plan (Step-by-Step)

1. Add enums and extend Payment schema
2. Create PaymentMonth, PaymentEquipmentItem models
3. Run prisma db push
4. Plan migration for existing payments
5. Implement create-payment server action
6. Add payment-types.ts (labels, helpers)
7. Build payments page + client
8. Build create payment dialog with type selector
9. Build dynamic form (monthly/equipment/exam)
10. Month selector component
11. Equipment items selector component
12. Load Sports Equipment + Exams for dropdowns
13. Wire form to action, close on success
14. Payment details view
15. Filters/search if needed
16. Integrate with record-payment and overdue widget
17. Testing

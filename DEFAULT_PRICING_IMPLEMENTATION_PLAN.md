# Default Pricing – Implementation Plan (v1)

**Status:** Implemented (with clarifications applied).

### Clarifications Applied
1. **unitAmountSnapshot:** Required for all NEW equipment items; server rejects creation without it. Nullable in DB only for legacy rows.
2. **System Data amount:** Required; validated in create/update; not optional in UI.
3. **Equipment override:** unitAmountSnapshot = catalog price at payment time; Payment.amount = actual charged amount. Override does NOT modify item snapshots; no prorating.
4. **Exam auto-fill:** Refill amount from catalog when exam type changes.
5. **System Data UI:** Code read-only; Description editable; Amount editable; No delete.

---

## 1. Requirement Understanding

### Business Goal
- System Data (Sports Equipment and Exams) gains a default price per item.
- Payments module uses these as suggestions:
  - **Equipment:** Show unit price per item, auto-calculate line totals and grand total; user can override final amount.
  - **Exam:** Auto-fill amount from selected exam; user can override.

### Critical Rule: Amount vs Description
- **Descriptions:** Linked by code; can change globally; current catalog description is always used.
- **Amounts:** Historical snapshots only. If a payment was created when equipment cost 250 or exam cost 180, that price must remain in history even after catalog prices change.
- **In practice:** Catalog amount = default/suggestion at creation time. Stored payment must capture the actual amount/price at that moment.

### Scope
- Add `amount` to SportsEquipment and Exam in System Data.
- Equipment payment: show per-item amount, line totals, auto-calc total; user override.
- Exam payment: auto-fill amount; user override.
- Store snapshots so history preserves the price at payment time.

---

## 2. Proposed Schema Changes

### 2.1 SportsEquipment
**Add:**
- `amount` – `Decimal @db.Decimal(10, 2)` (nullable for migration; default 0 or 0.00)
- Represents default/catalog unit price in currency.

**Keep:** `code`, `description`, `createdAt`, `updatedAt`.

### 2.2 Exam
**Add:**
- `amount` – `Decimal @db.Decimal(10, 2)` (nullable for migration; default 0 or 0.00)
- Represents default/catalog exam price.

**Keep:** `code`, `description`, `createdAt`, `updatedAt`.

### 2.3 Payment
**No change for exam.**
- `amount` is already the paid amount and serves as the snapshot for exam payments.
- For exam payments, `Payment.amount` = actual amount charged at creation time; no extra field needed.

### 2.4 PaymentEquipmentItem
**Add:**
- `unitAmountSnapshot` – `Decimal? @map("unit_amount_snapshot") @db.Decimal(10, 2)`
- Snapshot of unit price at payment time (nullable for pre-migration records).

**Keep:** `equipmentCode`, `quantity`.

### 2.5 No Other Model Changes
- No pricing history tables.
- No new relations.

---

## 3. Snapshot Strategy

### 3.1 Equipment Payments
- **Per item:** `unitAmountSnapshot` on `PaymentEquipmentItem`.
- **Flow:** At creation time, for each equipment item, set `unitAmountSnapshot` from the catalog (`SportsEquipment.amount`) at that moment.
- **Historical display:** Use `unitAmountSnapshot` when available; if null (legacy), show "—" or similar.
- **Total:** `Payment.amount` remains the total amount charged; user can override. Line totals (`unitAmountSnapshot × quantity`) can be shown for history, but the authoritative charge is `Payment.amount`.

### 3.2 Exam Payments
- **No extra field needed.** `Payment.amount` already stores the charge and is the historical snapshot.
- **Reason:** Exam has a single amount; it is written at creation time and does not change when catalog changes.
- **Display:** Always use `Payment.amount`; catalog amount is only for pre-fill.

### 3.3 Legacy Data
- Existing `PaymentEquipmentItem`: `unitAmountSnapshot` = null.
- UI/details: show description and quantity; for price show "—" or "לא נשמר" when snapshot is null.

---

## 4. UI Changes

### 4.1 System Data Page
- **Sports Equipment table:** Add column "מחיר ברירת מחדל" (or "סכום"); editable in create/edit.
- **Exams table:** Add column "מחיר ברירת מחדל" (or "סכום"); editable in create/edit.
- **Create forms:** Add amount field (number, step 0.01, min 0).
- **Edit flows:** Include amount in update forms.
- **Display:** Show amount in list (e.g. ₪X.XX or "-" when null/0).

### 4.2 Equipment Payment Form (Create)
- **Item rows:** For each row, show unit amount from catalog (e.g. "₪250.00") beside the item.
- **Line total:** Per row show "סכום: ₪X.XX" (unit × quantity).
- **Calculated total:** Show "סה״כ: ₪Y.YY" from sum of line totals.
- **Amount field:** Label "סכום כולל *"; default value = calculated total; user can edit.
- **Behavior:** Recalculate when items/quantities change; keep amount field editable.

### 4.3 Exam Payment Form (Create)
- **Exam select:** On change, set amount field from selected exam’s `amount`.
- **Amount field:** Keeps "סכום *"; value auto-filled; user can edit.
- **Placement:** Amount before exam type so it updates when exam changes (or after; UX choice).

### 4.4 Payment Details Modal
- **Equipment:** For each item, show `unitAmountSnapshot × quantity` when snapshot exists; otherwise show quantity only and "—" for price.
- **Exam:** Already shows `Payment.amount`; no change.

---

## 5. Auto-calculation Logic

### 5.1 Equipment
- **Line total:** `unitAmount × quantity` (use catalog amount; treat null/undefined as 0).
- **Total:** `sum(lineTotals)`.
- **Flow:**
  1. User selects items and quantities.
  2. On each change, recalc total.
  3. Auto-fill amount field with calculated total.
  4. User can change amount field at any time.
  5. On submit, use amount field (not necessarily the recalc total).

### 5.2 Exam
- On exam select change, read catalog `amount` and set amount field.
- Treat null/undefined as 0.
- User can always edit amount field.

### 5.3 Manual Override
- Amount field is never read-only; always editable.
- Submitting sends the value in the amount field, regardless of catalog.
- Server stores:
  - Equipment: per-item `unitAmountSnapshot` from catalog at submit; `Payment.amount` from form.
  - Exam: `Payment.amount` from form (which may have started as catalog amount).

---

## 6. Risks / Edge Cases

### 6.1 Null or Zero Catalog Amount
- **Equipment:** Treat null/undefined as 0 in calculations; user can still enter a non-zero total.
- **Exam:** Treat null/undefined as 0 when pre-filling; user can enter amount manually.

### 6.2 Equipment: Override vs Line Totals
- User might override total to differ from sum of line totals (e.g. discount, rounding).
- **Allowed.** `Payment.amount` = what was charged; line totals are for display/breakdown.

### 6.3 Catalog Change During Form Fill
- User selects item; catalog price changes before submit.
- **Acceptable.** Snapshot is taken at submit time from current catalog. No locking needed for v1.

### 6.4 Migration
- Existing SportsEquipment/Exam: `amount` null or 0.
- Existing PaymentEquipmentItem: `unitAmountSnapshot` null.
- UI must handle null without breaking.

### 6.5 Precision
- Use `Decimal(10, 2)` for amounts.
- UI: standard number input step 0.01; JS may use numbers; server parses and stores as Decimal.

---

## 7. Final Implementation Plan (Step-by-Step)

### Phase A: Schema & System Data
1. **Schema**
   - Add `amount` to `SportsEquipment` (Decimal, nullable, default 0).
   - Add `amount` to `Exam` (Decimal, nullable, default 0).
   - Add `unitAmountSnapshot` to `PaymentEquipmentItem` (Decimal, nullable).
   - Create and run migration (or db push for dev).

2. **System Data – Backend**
   - Extend `createSportsEquipment` and `updateSportsEquipment` to accept and persist amount.
   - Extend `createExam` and `updateExam` to accept and persist amount.

3. **System Data – UI**
   - Add amount field to sports equipment create/edit forms.
   - Add amount field to exam create/edit forms.
   - Add amount column to both tables.
   - Pass amount in props/types (number or null).

### Phase B: Payments – Equipment
4. **Data Loading**
   - Payments page: load `amount` for SportsEquipment (already loaded; add to select).
   - Pass to client for equipment rows.

5. **Equipment Form – UI**
   - For each equipment row, show unit amount from catalog.
   - Add line total display per row (unit × qty).
   - Add calculated total display.
   - Make amount field controlled; default to calculated total; recalc on item/qty change.
   - Keep amount field editable.

6. **Equipment Form – Submit**
   - Form submits amount from amount field.
   - Server: for each item, set `unitAmountSnapshot` from catalog at submit time.
   - Create Payment with submitted amount; create PaymentEquipmentItem with `unitAmountSnapshot`.

### Phase C: Payments – Exam
7. **Data Loading**
   - Payments page: load `amount` for Exams (already loaded; add to select).

8. **Exam Form – UI**
   - On exam select change, set amount field from exam’s amount (or 0 if null).
   - Amount field stays editable.

9. **Exam Form – Submit**
   - No change; amount already comes from form and is stored in `Payment.amount`.

### Phase D: Details & Display
10. **Details Modal**
    - Equipment: for each item, show `unitAmountSnapshot × quantity` when snapshot exists; otherwise "—".
    - No change for exam (already shows `Payment.amount`).

11. **Tests / Manual QA**
    - Equipment: create with prices, change catalog, confirm old payments show old prices.
    - Exam: same.
    - Override: change amount and confirm stored value.

### Phase E: Cleanup
12. **Optional**
    - Revisit null handling and default labels if needed.
    - Consider defaulting `amount` to 0 in schema if desired.

---

## 8. Unclear or Deferred Points

- **Default for new records:** `amount` null vs 0 – recommend 0 for simpler UI.
- **Currency:** Assume single currency (e.g. ₪); no currency field in v1.
- **Negative amounts:** Not in scope; keep amount >= 0.
- **Bulk import/export for amounts:** Out of scope for v1.

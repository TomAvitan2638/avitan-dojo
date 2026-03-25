/**
 * Shared parsing/validation for payment amounts and date-only fields.
 * Matches Prisma Decimal(10,2) and @db.Date semantics.
 */

/** Max absolute value for payment amount (Decimal(10,2): 8 integer + 2 fraction digits) */
export const MAX_PAYMENT_AMOUNT = 99_999_999.99;

const AMOUNT_ERROR_HE = "סכום לא תקין או גדול מדי (מקסימום 99,999,999.99)";

/**
 * Normalizes amount string: spaces, commas (thousands or decimal), then parses.
 */
function normalizeAmountString(raw: string): string {
  let s = raw.trim().replace(/\s/g, "");
  if (!s) return "";
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastComma > lastDot) {
    // Likely European: 1.234,56 or 123,45
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }
  return s;
}

export type ParseAmountResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Parses payment amount for Decimal(10,2). Rejects NaN, Infinity, negative (unless explicitly allowed), overflow.
 */
export function parsePaymentAmount(
  raw: string | null | undefined,
  options?: { allowNegative?: boolean }
): ParseAmountResult {
  const allowNegative = options?.allowNegative ?? false;
  const normalized = normalizeAmountString((raw ?? "").trim());
  if (!normalized) {
    return { ok: false, error: "סכום נדרש" };
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) {
    return { ok: false, error: AMOUNT_ERROR_HE };
  }
  if (!allowNegative && n < 0) {
    return { ok: false, error: "סכום לא תקין" };
  }
  const rounded = Math.round(n * 100) / 100;
  if (!Number.isFinite(rounded)) {
    return { ok: false, error: AMOUNT_ERROR_HE };
  }
  if (Math.abs(rounded) > MAX_PAYMENT_AMOUNT) {
    return { ok: false, error: AMOUNT_ERROR_HE };
  }
  return { ok: true, value: rounded };
}

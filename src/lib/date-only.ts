/**
 * Calendar date helpers for @db.Date fields (PostgreSQL DATE).
 * Prisma returns JS Date at UTC midnight for date-only columns; use UTC getters
 * for ISO/display strings so they match the stored calendar day in every timezone.
 */

/**
 * Parses `YYYY-MM-DD` from form input into UTC midnight for that calendar day.
 */
export function parseDateOnlyFromForm(s: string | null | undefined): Date | null {
  const trimmed = s?.trim();
  if (!trimmed) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!m) return null;
  const y = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isInteger(y) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(y, month - 1, day, 0, 0, 0, 0));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null;
  }
  return d;
}

/** `YYYY-MM-DD` for <input type="date"> from a DB Date (UTC calendar components). */
export function formatDateOnlyToIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** `dd/MM/yyyy` display from a DB Date (UTC calendar components). */
export function formatDateOnlyToDisplay(d: Date): string {
  const day = d.getUTCDate();
  const m = d.getUTCMonth() + 1;
  const y = d.getUTCFullYear();
  return `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

/**
 * Today's local calendar date as `YYYY-MM-DD` for default value on date inputs.
 * (Do not use `toISOString().slice(0, 10)` — that is UTC "today" and can be wrong locally.)
 */
export function todayLocalCalendarIso(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = t.getMonth() + 1;
  const day = t.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

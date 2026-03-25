/** Normalize email for sign-in (trim + lowercase). */
export function normalizeLoginEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** Basic RFC-style check for login / reset flows (no DNS verification). */
export function isValidLoginEmail(input: string): boolean {
  const e = normalizeLoginEmail(input);
  if (e.length < 3 || e.length > 254) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

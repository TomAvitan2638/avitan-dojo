/** Browser localStorage keys for auth UX (not secrets). */

export const REMEMBERED_EMAIL_KEY = "remembered_email";

/** Unix ms when password login succeeded; used for 24h client-side session cap. */
export const LOGIN_TIME_KEY = "login_time";

export const SESSION_DURATION_MS = 86_400_000;

export function persistRememberedEmail(email: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  } catch {
    /* quota / private mode */
  }
}

export function persistLoginTimestamp(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOGIN_TIME_KEY, String(Date.now()));
  } catch {
    /* quota / private mode */
  }
}

export function readRememberedEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function readLoginTimestamp(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOGIN_TIME_KEY);
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function clearLoginTimestamp(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOGIN_TIME_KEY);
  } catch {
    /* ignore */
  }
}

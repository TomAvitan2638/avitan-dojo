/**
 * Persists TOTP enrollment QR/secret for the current browser session only,
 * so a refresh mid-setup can still show the QR when Supabase does not return it on listFactors.
 */

const STORAGE_KEY = "avitan_mfa_totp_enroll_v1";

export type StoredTotpEnroll = {
  factorId: string;
  qr_code: string;
  secret: string;
  uri: string;
};

export function readTotpEnrollPayload(
  factorId: string
): StoredTotpEnroll | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTotpEnroll;
    return parsed.factorId === factorId ? parsed : null;
  } catch {
    return null;
  }
}

export function writeTotpEnrollPayload(payload: StoredTotpEnroll): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function clearTotpEnrollPayload(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function totpQrToSrc(qr_code: string): string {
  if (qr_code.startsWith("data:")) {
    return qr_code;
  }
  return `data:image/svg+xml;utf-8,${encodeURIComponent(qr_code)}`;
}

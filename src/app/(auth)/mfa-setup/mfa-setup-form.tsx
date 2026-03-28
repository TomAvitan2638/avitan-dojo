"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import {
  clearTotpEnrollPayload,
  readTotpEnrollPayload,
  totpQrToSrc,
  writeTotpEnrollPayload,
} from "@/lib/mfa-enroll-client";

const FALLBACK_NO_QR_HE =
  "אם כבר סרקתם את קוד ה־QR באפליקציית המאמת (למשל Microsoft Authenticator), ניתן להזין כאן את קוד האימות בן 6 הספרות להשלמת ההגדרה.";

const FALLBACK_ADMIN_HE =
  "אם טרם סרקתם קוד, ואין ברשותכם את ה־QR או את המפתח הידני, לא ניתן להשלים את ההגדירה מהמסך הזה בלי תמיכה מהמנהל — כדי למנוע יצירת גורמי אימות כפולים.";

export function MfaSetupForm() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [qrUnavailable, setQrUnavailable] = useState(false);
  const [code, setCode] = useState("");
  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const { data: factors, error: listErr } =
        await supabase.auth.mfa.listFactors();

      if (cancelled) return;

      if (listErr) {
        setBootError("לא ניתן לטעון את הגדרות האימות. נסו שוב מאוחר יותר.");
        setBootLoading(false);
        return;
      }

      if (factors?.totp?.length) {
        router.replace("/mfa-verify");
        return;
      }

      const unverified = (factors?.all ?? [])
        .filter(
          (f) => f.factor_type === "totp" && f.status === "unverified"
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      if (unverified.length > 0) {
        const f = unverified[0];
        setFactorId(f.id);
        const stored = readTotpEnrollPayload(f.id);
        if (stored) {
          setQrSrc(totpQrToSrc(stored.qr_code));
          setSecret(stored.secret);
        } else {
          setQrUnavailable(true);
        }
        setBootLoading(false);
        queueMicrotask(() => codeRef.current?.focus());
        return;
      }

      const { data: enrollData, error: enErr } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Authenticator",
        });

      if (cancelled) return;

      if (enErr || !enrollData?.totp) {
        setBootError(
          "לא ניתן להתחיל הגדרת אימות דו-שלבי. נסו שוב או פנו למנהל המערכת."
        );
        setBootLoading(false);
        return;
      }

      writeTotpEnrollPayload({
        factorId: enrollData.id,
        qr_code: enrollData.totp.qr_code,
        secret: enrollData.totp.secret,
        uri: enrollData.totp.uri,
      });
      setFactorId(enrollData.id);
      setQrSrc(totpQrToSrc(enrollData.totp.qr_code));
      setSecret(enrollData.totp.secret);
      setBootLoading(false);
      queueMicrotask(() => codeRef.current?.focus());
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldError(undefined);

    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setFieldError("יש להזין קוד בן 6 ספרות");
      return;
    }

    if (!factorId) {
      setFormError("חסר מזהה גורם אימות. רעננו את הדף או פנו למנהל.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: cvErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: digits,
    });

    setLoading(false);

    if (cvErr) {
      setFormError("קוד שגוי או שפג תוקף. נסו שוב.");
      return;
    }

    clearTotpEnrollPayload();

    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aal?.currentLevel === "aal2") {
      router.replace("/dashboard");
    } else {
      router.replace("/mfa-verify");
    }
    router.refresh();
  }

  if (bootLoading) {
    return (
      <AuthCard title="הגדרת אימות דו-שלבי" subtitle="טוען…">
        <div className="py-8 text-center text-base text-muted-foreground">טוען…</div>
      </AuthCard>
    );
  }

  if (bootError) {
    return (
      <AuthCard title="הגדרת אימות דו-שלבי">
        <p className="text-center text-base text-destructive" role="alert">
          {bootError}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="הגדרת אימות דו-שלבי"
      subtitle="נדרש מאמת (למשל Microsoft Authenticator) כדי להמשיך."
    >
      <div
        className="mb-6 rounded-xl border border-amber-600/30 bg-amber-50 px-4 py-3 text-base leading-relaxed text-amber-950"
        role="note"
      >
        שמרו את מפתח ה־TOTP בסוד — כמו סיסמה. אל תשתפו צילומי מסך של ה־QR או
        את המפתח הידני.
      </div>

      {qrUnavailable ? (
        <div className="mb-6 space-y-3 text-base leading-relaxed text-foreground">
          <p>{FALLBACK_NO_QR_HE}</p>
          <p className="text-muted-foreground">{FALLBACK_ADMIN_HE}</p>
        </div>
      ) : (
        <>
          {qrSrc ? (
            <div className="mb-6 flex justify-center transition-opacity duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc}
                alt="קוד QR לסריקה באפליקציית המאמת"
                className="size-52 max-w-full rounded-xl bg-white p-3 shadow-md"
              />
            </div>
          ) : null}

          {secret ? (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                className="text-base text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {showSecret ? "הסתר מפתח ידני" : "הצג מפתח להזנה ידנית"}
              </button>
              {showSecret ? (
                <code
                  className="mt-3 block break-all rounded-lg border border-border bg-muted p-3 text-left text-base text-foreground"
                  dir="ltr"
                >
                  {secret}
                </code>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <AuthInput
          ref={codeRef}
          label="קוד בן 6 ספרות מהמאמת"
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          error={fieldError}
          dir="ltr"
          className="text-center text-2xl tracking-[0.4em]"
          placeholder="••••••"
        />

        {formError ? (
          <p
            className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-base text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <AuthButton loading={loading}>אמת והשלם הגדרה</AuthButton>
      </form>
    </AuthCard>
  );
}

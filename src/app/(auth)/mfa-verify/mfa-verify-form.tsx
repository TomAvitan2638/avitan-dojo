"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";

export function MfaVerifyForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (error) {
        setSetupError("לא ניתן לטעון אימות דו-שלבי. נסו שוב מאוחר יותר.");
        setBootLoading(false);
        return;
      }
      const totp = data?.totp?.[0];
      if (!totp) {
        router.replace("/mfa-setup");
        return;
      }
      setFactorId(totp.id);
      setBootLoading(false);
      inputRef.current?.focus();
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
      setFormError("אימות דו-שלבי לא זמין");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: challenge, error: chErr } =
      await supabase.auth.mfa.challenge({ factorId });

    if (chErr || !challenge) {
      setLoading(false);
      setFormError("לא ניתן לאמת כרגע. נסו שוב.");
      return;
    }

    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: digits,
    });

    setLoading(false);

    if (verErr) {
      setFormError("קוד שגוי או שפג תוקף. נסו שוב.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (bootLoading) {
    return (
      <AuthCard title="אימות דו-שלבי" subtitle="טוען…">
        <div className="py-8 text-center text-white/70">טוען…</div>
      </AuthCard>
    );
  }

  if (setupError) {
    return (
      <AuthCard title="אימות דו-שלבי">
        <p className="text-center text-sm text-red-200" role="alert">
          {setupError}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="אימות דו-שלבי"
      subtitle="הזינו את הקוד מאפליקציית המאמת"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthInput
          ref={inputRef}
          label="קוד בן 6 ספרות"
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          error={fieldError}
          dir="ltr"
          className="text-center text-2xl tracking-[0.4em]"
          placeholder="••••••"
        />

        {formError ? (
          <p
            className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-200"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <AuthButton loading={loading}>אמת והמשך</AuthButton>
      </form>
    </AuthCard>
  );
}

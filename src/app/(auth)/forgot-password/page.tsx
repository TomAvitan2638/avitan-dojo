"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { isValidLoginEmail, normalizeLoginEmail } from "@/lib/email";

const GENERIC_SUCCESS =
  "אם המייל קיים במערכת, נשלח אליו קישור לאיפוס סיסמה";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    const normalized = normalizeLoginEmail(email);
    if (!isValidLoginEmail(normalized)) {
      setError("נא להזין כתובת מייל תקינה");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

    await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${appUrl.replace(/\/$/, "")}/reset-password`,
    });

    setLoading(false);
    setDone(true);
  }

  return (
    <AuthCard title="איפוס סיסמה" subtitle="נשלח קישור לאיפוס למייל המקושר לחשבון">
      {done ? (
        <p
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-center text-sm leading-relaxed text-white/90"
          role="status"
        >
          {GENERIC_SUCCESS}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          <AuthInput
            ref={inputRef}
            label="מייל"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            dir="ltr"
            className="text-left"
          />

          <AuthButton loading={loading}>שלח קישור לאיפוס</AuthButton>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              חזרה להתחברות
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}

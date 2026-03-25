"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { isValidLoginEmail, normalizeLoginEmail } from "@/lib/email";
import {
  persistLoginTimestamp,
  persistRememberedEmail,
  readRememberedEmail,
} from "@/lib/auth-local-storage";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readRememberedEmail();
    if (saved) {
      setEmail(saved);
    }
    emailRef.current?.focus();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setEmailError(undefined);
    setPasswordError(undefined);

    const normalizedEmail = normalizeLoginEmail(email);
    if (!isValidLoginEmail(normalizedEmail)) {
      setEmailError("נא להזין כתובת מייל תקינה");
      return;
    }
    if (password.length < 8) {
      setPasswordError("סיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signErr) {
      setLoading(false);
      // DEBUG: remove before shipping — surface real Supabase error in prod
      console.error("signInWithPassword error", signErr);
      setFormError(signErr.message);
      return;
    }

    persistRememberedEmail(normalizedEmail);
    persistLoginTimestamp();

    setLoading(false);
    router.push("/auth/post-login");
    router.refresh();
  }

  return (
    <AuthCard title="אביטן דוג׳ו" subtitle="התחברות למערכת הניהול">
      {resetSuccess ? (
        <div
          className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-3 text-center text-sm text-emerald-100 transition-opacity duration-300"
          role="status"
        >
          הסיסמה עודכנה בהצלחה. ניתן להתחבר.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-5">
        <AuthInput
          ref={emailRef}
          label="מייל"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          dir="ltr"
          className="text-left"
          placeholder="name@example.com"
        />

        <AuthInput
          label="סיסמה"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passwordError}
          dir="ltr"
          className="text-left"
        />

        {formError ? (
          <p
            className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-200"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <AuthButton loading={loading} className="mt-2">
          התחברות
        </AuthButton>

        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            שכחתי סיסמה
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

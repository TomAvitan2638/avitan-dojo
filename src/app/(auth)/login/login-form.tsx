"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthCard } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { isValidLoginEmail, normalizeLoginEmail } from "@/lib/email";
import {
  persistLoginTimestamp,
  persistRememberedEmail,
  readRememberedEmail,
} from "@/lib/auth-local-storage";

/** Black outline via stacked text-shadows — readable red on busy bg (login only). */
const LOGIN_TITLE_OUTLINE =
  "[text-shadow:-1px_-1px_0_#0a0a0a,1px_-1px_0_#0a0a0a,-1px_1px_0_#0a0a0a,1px_1px_0_#0a0a0a,-2px_0_0_#0a0a0a,2px_0_0_#0a0a0a,0_-2px_0_#0a0a0a,0_2px_0_#0a0a0a,0_0_8px_rgba(0,0,0,0.45)]";

const LOGIN_SUBTITLE_OUTLINE =
  "[text-shadow:-1px_-1px_0_#0a0a0a,1px_-1px_0_#0a0a0a,-1px_1px_0_#0a0a0a,1px_1px_0_#0a0a0a,0_-1px_0_#0a0a0a,0_1px_0_#0a0a0a,-1px_0_0_#0a0a0a,1px_0_0_#0a0a0a,0_0_6px_rgba(0,0,0,0.4)]";

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
    <AuthCard
      title="אביטן דוג׳ו"
      subtitle="התחברות למערכת הניהול"
      titleClassName={cn(
        "text-5xl text-dojo-red sm:text-6xl",
        LOGIN_TITLE_OUTLINE
      )}
      subtitleClassName={cn("text-dojo-red", LOGIN_SUBTITLE_OUTLINE)}
    >
      {resetSuccess ? (
        <div
          className="mb-6 rounded-xl border border-emerald-600/35 bg-emerald-50 px-4 py-3 text-center text-base text-emerald-900 transition-opacity duration-300"
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
            className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-base text-destructive"
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
            className="text-base text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            שכחתי סיסמה
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { logoutFromApp } from "@/lib/auth-logout-client";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionReady) {
      inputRef.current?.focus();
    }
  }, [sessionReady]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setPwError(undefined);
    setConfirmError(undefined);

    if (password.length < 8) {
      setPwError("סיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    if (password !== confirm) {
      setConfirmError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setFormError("לא ניתן לעדכן את הסיסמה. נסו שוב או בקשו קישור חדש.");
      return;
    }

    await logoutFromApp();
    router.push("/login?reset=success");
    router.refresh();
  }

  if (!sessionReady) {
    return (
      <AuthCard title="סיסמה חדשה" subtitle="מאמתים את הקישור…">
        <div className="py-8 text-center text-white/70">טוען…</div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="סיסמה חדשה" subtitle="בחרו סיסמה חזקה לחשבון">
      <form onSubmit={onSubmit} className="space-y-5">
        <AuthInput
          ref={inputRef}
          label="סיסמה חדשה"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={pwError}
          dir="ltr"
          className="text-left"
        />

        <AuthInput
          label="אימות סיסמה"
          type="password"
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmError}
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

        <AuthButton loading={loading}>עדכן סיסמה</AuthButton>
      </form>
    </AuthCard>
  );
}

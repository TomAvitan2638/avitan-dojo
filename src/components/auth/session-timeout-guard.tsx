"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LOGIN_TIME_KEY,
  SESSION_DURATION_MS,
  clearLoginTimestamp,
} from "@/lib/auth-local-storage";

/**
 * Enforces a strict 24h window from `login_time` for any authenticated session.
 * Supabase may refresh tokens longer; this forces re-login client-side.
 */
export function SessionTimeoutGuard() {
  const checking = useRef(false);

  useEffect(() => {
    async function enforce() {
      if (checking.current) return;
      checking.current = true;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const raw =
          typeof window !== "undefined"
            ? window.localStorage.getItem(LOGIN_TIME_KEY)
            : null;
        const start = raw != null ? Number(raw) : NaN;
        const elapsed = Date.now() - start;

        if (
          raw == null ||
          !Number.isFinite(start) ||
          elapsed > SESSION_DURATION_MS
        ) {
          clearLoginTimestamp();
          await supabase.auth.signOut();
          window.location.assign("/login");
        }
      } finally {
        checking.current = false;
      }
    }

    void enforce();

    const interval = window.setInterval(() => void enforce(), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void enforce();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}

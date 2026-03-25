import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Lightweight: session refresh + user presence only.
 * MFA branching lives in `/auth/post-login`, auth guards, and server components.
 */
export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isLogin = path === "/login";
  const isPostLogin = path.startsWith("/auth/post-login");
  const isMfaVerify = path.startsWith("/mfa-verify");
  const isMfaSetup = path.startsWith("/mfa-setup");
  const isDashboard = path.startsWith("/dashboard");

  if (isDashboard && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((isMfaVerify || isMfaSetup || isPostLogin) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isLogin && user) {
    return NextResponse.redirect(new URL("/auth/post-login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/50 p-12 text-center text-white/80 backdrop-blur-xl">
      טוען…
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

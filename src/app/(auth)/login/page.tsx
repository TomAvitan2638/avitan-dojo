import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card/95 p-12 text-center text-base text-muted-foreground backdrop-blur-xl">
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

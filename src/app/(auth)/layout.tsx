import { AuthBackground } from "@/components/auth/AuthBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <AuthBackground />
      </div>
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-2xl font-bold text-foreground">Avitan Dojo</h1>
      <p className="mb-6 text-muted-foreground">
        מערכת ניהול מכון קראטה
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        התחברות
      </Link>
    </div>
  );
}

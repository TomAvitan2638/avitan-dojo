import { Header } from "@/components/dashboard/header";
import { Loader2 } from "lucide-react";

export default function InstructorsLoading() {
  return (
    <div className="min-h-screen">
      <Header title="מאמנים" />
      <div className="p-6">
        <div
          className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-card px-6 py-16 text-muted-foreground"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="טוען מאמנים"
        >
          <Loader2 className="h-10 w-10 animate-spin opacity-80" />
          <p className="text-sm font-medium">טוען נתוני מאמנים...</p>
        </div>
      </div>
    </div>
  );
}

import { type ClassValue } from "clsx";
import { cn } from "@/lib/utils";

/**
 * Shared surface for dashboard form controls (inputs, textareas, native selects).
 * Slightly elevated vs page/dialog background (`bg-popover`) for clearer affordance.
 */
const formControlSurface: ClassValue = [
  "rounded-md border border-input bg-popover",
  "text-foreground shadow-sm transition-colors",
  "placeholder:text-muted-foreground",
  "hover:border-muted-foreground/30",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:cursor-not-allowed disabled:opacity-50",
];

/** `sm:max-w-md` for compact creates, `sm:max-w-lg` for wide forms (e.g. students). */
export function createRecordDialogClassName(maxWidth: "md" | "lg" = "lg"): string {
  return cn(
    "flex max-h-[min(90vh,100dvh-2rem)] flex-col gap-0 overflow-hidden p-0",
    maxWidth === "md" ? "sm:max-w-md" : "sm:max-w-lg"
  );
}

/** Native `<select>` in dashboard forms — matches Input visual weight. */
export function formNativeSelectClassName(...extra: ClassValue[]): string {
  return cn(
    "flex h-10 w-full px-3 py-2 text-base",
    formControlSurface,
    extra
  );
}

/** Compact selects (e.g. grid row helpers). */
export function formNativeSelectCompactClassName(...extra: ClassValue[]): string {
  return cn(
    "flex h-9 min-w-[80px] flex-1 rounded-md border border-input bg-popover px-2 text-base text-foreground shadow-sm transition-colors hover:border-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/55",
    extra
  );
}

export function formControlSurfaceClasses(): string {
  return cn(formControlSurface);
}

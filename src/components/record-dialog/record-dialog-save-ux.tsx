"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { notifyDataWrite } from "@/lib/data-write-bus";
import { isLikelyDbMutationSuccess } from "@/lib/mutation-success-guards";

/** Unified copy for successful create/update flows in record dialogs */
export const RECORD_DIALOG_SAVE_SUCCESS_MESSAGE = "השמירה בוצעה בהצלחה";
export const RECORD_DIALOG_SAVE_REFRESH_MESSAGE = "מעדכן נתונים...";
export const RECORD_DIALOG_SAVE_PENDING_LABEL = "שומר...";
/** Auto-close delay after success (ms) */
export const RECORD_DIALOG_AUTOCLOSE_MS = 1300;

export type RecordSaveTailPhase = "idle" | "refreshing" | "success";

/**
 * Wraps a useFormState server action so `submitBusy` stays true for the whole
 * request (fixes stuck “pending” edge cases and exposes busy for dismiss guards).
 */
export function useWrappedFormState<S>(
  action: (prev: S | null, formData: FormData) => Promise<S>,
  initialState: S | null
) {
  const [submitBusy, setSubmitBusy] = useState(false);
  const wrapped = useCallback(
    async (prev: S | null, formData: FormData) => {
      setSubmitBusy(true);
      try {
        const result = await action(prev, formData);
        if (isLikelyDbMutationSuccess(result)) {
          notifyDataWrite();
        }
        return result;
      } finally {
        setSubmitBusy(false);
      }
    },
    [action]
  );
  const [state, formAction] = useFormState(
    wrapped as never,
    initialState as never
  );
  return { state: state as S | null, formAction, submitBusy };
}

type PostSaveOpts = {
  success: boolean | undefined;
  /** e.g. payment `_ts` so repeated successes re-run the lifecycle */
  successVersion?: number | string | undefined;
  isOpen: boolean;
  handledRef: MutableRefObject<boolean>;
  onAutoClose: () => void;
  /**
   * When set, runs instead of `router.refresh()` during the “refreshing” phase.
   * Resolve when async work (e.g. React Query invalidation) is finished.
   */
  syncOnSuccess?: () => Promise<void>;
};

/**
 * After `success`, triggers router refresh (or `syncOnSuccess`), then success tail (banner),
 * then `onAutoClose` after {@link RECORD_DIALOG_AUTOCLOSE_MS}.
 */
export function useRecordDialogPostSavePhase({
  success,
  successVersion,
  isOpen,
  handledRef,
  onAutoClose,
  syncOnSuccess,
}: PostSaveOpts) {
  const router = useRouter();
  const [refreshPending, startTransition] = useTransition();
  const [tailPhase, setTailPhase] = useState<RecordSaveTailPhase>("idle");
  const onAutoCloseRef = useRef(onAutoClose);
  onAutoCloseRef.current = onAutoClose;

  useEffect(() => {
    if (!isOpen) {
      setTailPhase("idle");
      handledRef.current = false;
    }
  }, [isOpen, handledRef]);

  useEffect(() => {
    if (success && isOpen && !handledRef.current) {
      handledRef.current = true;
      setTailPhase("refreshing");
      if (syncOnSuccess) {
        let cancelled = false;
        void (async () => {
          try {
            await syncOnSuccess();
          } finally {
            if (!cancelled) setTailPhase("success");
          }
        })();
        return () => {
          cancelled = true;
        };
      }
      startTransition(() => router.refresh());
    }
  }, [success, successVersion, isOpen, router, handledRef, syncOnSuccess]);

  useEffect(() => {
    if (syncOnSuccess) return;
    if (tailPhase === "refreshing" && !refreshPending) {
      setTailPhase("success");
    }
  }, [tailPhase, refreshPending, syncOnSuccess]);

  useEffect(() => {
    if (tailPhase === "success") {
      const t = setTimeout(() => {
        onAutoCloseRef.current();
        setTailPhase("idle");
        handledRef.current = false;
      }, RECORD_DIALOG_AUTOCLOSE_MS);
      return () => clearTimeout(t);
    }
  }, [tailPhase, handledRef]);

  return { tailPhase, setTailPhase, refreshPending };
}

/** Exactly one status row: refreshing OR success (never both). */
export function RecordDialogSaveTailBanners({
  phase,
  className,
  bannerClassName,
}: {
  phase: RecordSaveTailPhase;
  className?: string;
  /** Optional layout tweak, e.g. `flex-row-reverse` for RTL footers */
  bannerClassName?: string;
}) {
  if (phase === "refreshing") {
    return (
      <div className={className}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 dark:text-blue-400",
            bannerClassName
          )}
          role="status"
        >
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          {RECORD_DIALOG_SAVE_REFRESH_MESSAGE}
        </div>
      </div>
    );
  }
  if (phase === "success") {
    return (
      <div className={className}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400",
            bannerClassName
          )}
          role="status"
        >
          <CheckCircle className="h-5 w-5 shrink-0" />
          {RECORD_DIALOG_SAVE_SUCCESS_MESSAGE}
        </div>
      </div>
    );
  }
  return null;
}

/** Disables all controls inside while submitting or during refresh/success tail. */
export function RecordDialogBodyLock({
  tailPhase,
  children,
  className,
}: {
  tailPhase: RecordSaveTailPhase;
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || tailPhase !== "idle";
  return (
    <fieldset
      disabled={disabled}
      className={cn(
        "min-w-0 border-0 p-0 disabled:pointer-events-none disabled:opacity-60",
        className
      )}
    >
      {children}
    </fieldset>
  );
}

export function RecordDialogPrimarySubmitButton({
  className,
  submitLabel = "שמירה",
  forceDisabled = false,
}: {
  className?: string;
  submitLabel?: string;
  forceDisabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || forceDisabled;
  return (
    <Button
      type="submit"
      disabled={disabled}
      className={cn("bg-dojo-red hover:bg-dojo-red/90", className)}
    >
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          {RECORD_DIALOG_SAVE_PENDING_LABEL}
        </>
      ) : (
        submitLabel
      )}
    </Button>
  );
}

export function RecordDialogCancelButton({
  onClick,
  forceDisabled = false,
}: {
  onClick: () => void;
  forceDisabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending || forceDisabled}
      onClick={onClick}
    >
      ביטול
    </Button>
  );
}

export function recordDialogBlockDismiss(
  tailPhase: RecordSaveTailPhase,
  submitBusy: boolean
) {
  return tailPhase === "refreshing" || submitBusy;
}

"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createInstructorPayment } from "@/server/actions/create-instructor-payment";
import type { CreateInstructorPaymentState } from "@/server/actions/create-instructor-payment";
import { updateInstructorPayment } from "@/server/actions/update-instructor-payment";
import type { UpdateInstructorPaymentState } from "@/server/actions/update-instructor-payment";
import { deleteInstructorPayment } from "@/server/actions/delete-instructor-payment";
import {
  todayLocalCalendarIso,
  formatDateOnlyToDisplay,
  parseDateOnlyFromForm,
} from "@/lib/date-only";
import { formNativeSelectClassName } from "@/lib/form-field";
import { invalidateInstructorPaymentsPanelAndDashboardHome } from "@/lib/instructor-payments-query";
import { useInstructorPaymentsPanelQuery } from "@/hooks/use-instructor-payments-panel-query";
import {
  ListLoadingBanner,
  LIST_PAGE_SHIMMER_CLASS,
} from "@/components/dashboard/dashboard-loading-skeleton";
import { cn } from "@/lib/utils";
import {
  useWrappedFormState,
  useRecordDialogPostSavePhase,
  RecordDialogSaveTailBanners,
  RecordDialogBodyLock,
  RecordDialogPrimarySubmitButton,
  RecordDialogCancelButton,
  recordDialogBlockDismiss,
} from "@/components/record-dialog/record-dialog-save-ux";
import type { InstructorOption, InstructorPaymentListRow } from "@/types/instructor-payments-panel";
import { Loader2, Plus, Eye, Pencil, Trash2, CheckCircle } from "lucide-react";

const MONTHS_HE = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

function CoachMonthsEditor({
  selectedMonths,
  setSelectedMonths,
  currentYear,
}: {
  selectedMonths: { year: number; month: number }[];
  setSelectedMonths: React.Dispatch<
    React.SetStateAction<{ year: number; month: number }[]>
  >;
  currentYear: number;
}) {
  const isMonthTaken = (year: number, month: number, excludeIdx: number) =>
    selectedMonths.some(
      (m, i) => i !== excludeIdx && m.year === year && m.month === month
    );

  const addMonth = () => {
    const used = new Set(selectedMonths.map((m) => `${m.year}-${m.month}`));
    let y = currentYear;
    let month = 1;
    while (used.has(`${y}-${month}`)) {
      month++;
      if (month > 12) {
        month = 1;
        y++;
      }
      if (y > currentYear + 1) break;
    }
    setSelectedMonths((prev) => [...prev, { year: y, month }]);
  };

  const removeMonth = (idx: number) => {
    setSelectedMonths((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMonth = (idx: number, year: number, month: number) => {
    setSelectedMonths((prev) => {
      if (prev.some((m, i) => i !== idx && m.year === year && m.month === month)) {
        return prev;
      }
      return prev.map((m, i) => (i === idx ? { year, month } : m));
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex justify-between items-center gap-2">
        <Label>חודשים לכיסוי *</Label>
        <Button type="button" variant="ghost" size="sm" onClick={addMonth} className="shrink-0">
          <Plus className="h-4 w-4" />
          <span className="sr-only">הוספת חודש</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        שנה: שנה קודמת, נוכחית או הבאה — כמו בתשלום חודשי לתלמידים.
      </p>
      {selectedMonths.length === 0 ? (
        <p className="text-sm text-muted-foreground">לחץ + להוספת חודש</p>
      ) : (
        <div className="space-y-2">
          {selectedMonths.map((m, idx) => (
            <div key={idx} className="flex gap-2 items-center flex-wrap">
              <select
                value={m.year}
                onChange={(e) => updateMonth(idx, parseInt(e.target.value, 10), m.month)}
                className={formNativeSelectClassName("h-9 w-auto shrink-0 px-2")}
                aria-label={`שנה לכיסוי ${idx + 1}`}
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y} disabled={isMonthTaken(y, m.month, idx)}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                value={m.month}
                onChange={(e) => updateMonth(idx, m.year, parseInt(e.target.value, 10))}
                className={formNativeSelectClassName("min-w-0 flex-1 px-2")}
                aria-label={`חודש לכיסוי ${idx + 1}`}
              >
                {MONTHS_HE.map((name, i) => (
                  <option
                    key={i}
                    value={i + 1}
                    disabled={isMonthTaken(m.year, i + 1, idx)}
                  >
                    {name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMonth(idx)}
                className="shrink-0"
                aria-label="הסרת חודש"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CoachPaymentCreateDialog({
  open,
  onOpenChange,
  active,
  queryClient,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  active: InstructorOption[];
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const handledRef = useRef(false);
  const [formKey, setFormKey] = useState(0);
  const [selectedMonths, setSelectedMonths] = useState<
    { year: number; month: number }[]
  >([]);

  const currentYear = new Date().getFullYear();

  const { state, formAction, submitBusy } = useWrappedFormState(
    createInstructorPayment,
    null as CreateInstructorPaymentState | null
  );

  /** Stable reference required: hook effect depends on syncOnSuccess; inline async fn re-runs cleanup and cancels success transition after notifyDataWrite re-renders. */
  const syncOnSuccess = useCallback(async () => {
    await invalidateInstructorPaymentsPanelAndDashboardHome(queryClient);
  }, [queryClient]);

  const { tailPhase } = useRecordDialogPostSavePhase({
    success: state?.success,
    successVersion: state?._ts,
    isOpen: open,
    handledRef,
    onAutoClose: () => {
      onOpenChange(false);
      setFormKey((k) => k + 1);
      setSelectedMonths([]);
    },
    syncOnSuccess,
  });

  useEffect(() => {
    if (!open) {
      setSelectedMonths([]);
    }
  }, [open]);

  const monthsJson = JSON.stringify(
    selectedMonths.filter((m) => m.year && m.month)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && recordDialogBlockDismiss(tailPhase, submitBusy)) return;
        onOpenChange(o);
        if (!o) {
          setFormKey((k) => k + 1);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="bg-dojo-red hover:bg-dojo-red/90"
          onClick={() => setSelectedMonths([])}
        >
          <Plus className="ml-2 h-4 w-4" />
          הוספת תשלום
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">הוספת תשלום מאמן</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            רישום תשלום דמי מאמן לבעל הדוג׳ו — סכום מלא וחודשי כיסוי נבחרים בנפרד מתאריך הקבלה.
          </DialogDescription>
        </DialogHeader>
        <form
          key={formKey}
          action={formAction}
          className="grid gap-4 py-2"
          onSubmit={() => {
            handledRef.current = false;
          }}
          {...(tailPhase !== "idle" || submitBusy ? { "aria-busy": true } : {})}
        >
          <RecordDialogBodyLock tailPhase={tailPhase}>
            <div className="grid gap-2">
              <Label htmlFor="coach-create-instructor">מאמן *</Label>
              <select
                id="coach-create-instructor"
                name="instructorId"
                required
                className={formNativeSelectClassName()}
                defaultValue=""
              >
                <option value="" disabled>
                  בחר מאמן
                </option>
                {active.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.firstName} {i.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coach-create-amount">סכום (₪) *</Label>
              <Input
                id="coach-create-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                required
                placeholder="לדוגמה: 500 או 500.50"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                סכום מלא לתשלום זה. חודשי הכיסוי אינם מחלקים את הסכום.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coach-create-date">תאריך תשלום (קבלה) *</Label>
              <Input
                id="coach-create-date"
                name="paymentDate"
                type="date"
                required
                defaultValue={todayLocalCalendarIso()}
              />
            </div>

            <input type="hidden" name="months" value={monthsJson} />

            <CoachMonthsEditor
              selectedMonths={selectedMonths}
              setSelectedMonths={setSelectedMonths}
              currentYear={currentYear}
            />

            <div className="grid gap-2">
              <Label htmlFor="coach-create-notes">הערות (אופציונלי)</Label>
              <Textarea
                id="coach-create-notes"
                name="notes"
                rows={2}
                className="resize-y min-h-[80px]"
                placeholder="לדוגמה: העברה בנקאית, מזומן..."
              />
            </div>
          </RecordDialogBodyLock>

          <RecordDialogSaveTailBanners phase={tailPhase} />
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex flex-row-reverse justify-start gap-2 pt-2">
            {tailPhase === "idle" && (
              <>
                <RecordDialogPrimarySubmitButton
                  submitLabel="שמירה"
                  forceDisabled={selectedMonths.length === 0}
                />
                <RecordDialogCancelButton
                  onClick={() => onOpenChange(false)}
                  forceDisabled={false}
                />
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CoachPaymentEditDialog({
  payment,
  open,
  onOpenChange,
  queryClient,
}: {
  payment: InstructorPaymentListRow;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const handledRef = useRef(false);
  const currentYear = new Date().getFullYear();
  const [selectedMonths, setSelectedMonths] = useState<
    { year: number; month: number }[]
  >(() =>
    [...payment.coveredMonths].sort(
      (a, b) => a.year - b.year || a.month - b.month
    )
  );

  useEffect(() => {
    setSelectedMonths(
      [...payment.coveredMonths].sort(
        (a, b) => a.year - b.year || a.month - b.month
      )
    );
  }, [payment]);

  const updateFn = useCallback(
    async (
      prev: UpdateInstructorPaymentState | null,
      formData: FormData
    ) => updateInstructorPayment(payment.id, prev, formData),
    [payment.id]
  );

  const { state, formAction, submitBusy } = useWrappedFormState(
    updateFn,
    null as UpdateInstructorPaymentState | null
  );

  const syncOnSuccess = useCallback(async () => {
    await invalidateInstructorPaymentsPanelAndDashboardHome(queryClient);
  }, [queryClient]);

  const { tailPhase } = useRecordDialogPostSavePhase({
    success: state?.success,
    successVersion: state?._ts,
    isOpen: open,
    handledRef,
    onAutoClose: () => onOpenChange(false),
    syncOnSuccess,
  });

  const monthsJson = JSON.stringify(
    selectedMonths.filter((m) => m.year && m.month)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && recordDialogBlockDismiss(tailPhase, submitBusy)) return;
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">עריכת תשלום מאמן</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            עדכון פרטי התשלום וחודשי הכיסוי.
          </DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          className="grid gap-4 py-2"
          {...(tailPhase !== "idle" || submitBusy ? { "aria-busy": true } : {})}
        >
          <RecordDialogBodyLock tailPhase={tailPhase}>
            <div className="grid gap-2">
              <Label>מאמן</Label>
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                {payment.instructorName}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coach-edit-amount">סכום (₪) *</Label>
              <Input
                id="coach-edit-amount"
                name="amount"
                type="text"
                inputMode="decimal"
                required
                defaultValue={payment.amount.toFixed(2)}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="coach-edit-date">תאריך תשלום (קבלה) *</Label>
              <Input
                id="coach-edit-date"
                name="paymentDate"
                type="date"
                required
                defaultValue={payment.paymentDateIso}
              />
            </div>

            <input type="hidden" name="months" value={monthsJson} />

            <CoachMonthsEditor
              selectedMonths={selectedMonths}
              setSelectedMonths={setSelectedMonths}
              currentYear={currentYear}
            />

            <div className="grid gap-2">
              <Label htmlFor="coach-edit-notes">הערות (אופציונלי)</Label>
              <Textarea
                id="coach-edit-notes"
                name="notes"
                rows={2}
                className="resize-y min-h-[80px]"
                placeholder="הערות..."
                defaultValue={payment.notes ?? ""}
              />
            </div>
          </RecordDialogBodyLock>

          <RecordDialogSaveTailBanners phase={tailPhase} />
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex flex-row-reverse justify-start gap-2 pt-2">
            {tailPhase === "idle" && (
              <>
                <RecordDialogPrimarySubmitButton
                  submitLabel="שמירה"
                  forceDisabled={selectedMonths.length === 0}
                />
                <RecordDialogCancelButton
                  onClick={() => onOpenChange(false)}
                  forceDisabled={false}
                />
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CoachPaymentsSection() {
  const queryClient = useQueryClient();
  const { data, isError, error, refetch, isPending } = useInstructorPaymentsPanelQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState<InstructorPaymentListRow | null>(
    null
  );
  const [editPayment, setEditPayment] = useState<InstructorPaymentListRow | null>(
    null
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deletePhase, setDeletePhase] = useState<"idle" | "refreshing" | "success">(
    "idle"
  );

  const loadingWithoutData = isPending && !data;

  if (loadingWithoutData) {
    return (
      <div className="space-y-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-muted-foreground">תשלומי מאמנים</h2>
          <Button type="button" disabled className="bg-dojo-red/50">
            <Plus className="ml-2 h-4 w-4" />
            הוספת תשלום
          </Button>
        </div>
        <ListLoadingBanner
          title="טוען תשלומי מאמנים..."
          subtitle="אנא המתן"
        />
        <div className={cn("h-32 rounded-lg border border-border/60", LIST_PAGE_SHIMMER_CLASS)} />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-card p-8 text-center">
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "שגיאה בטעינה"}
        </p>
        <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>
          נסה שוב
        </Button>
      </div>
    );
  }

  const payload = data!;
  const active = payload.activeInstructors;
  const payments = payload.payments;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-foreground">תשלומי מאמנים</h2>
        {active.length === 0 ? (
          <Button type="button" disabled className="bg-dojo-red/50">
            <Plus className="ml-2 h-4 w-4" />
            הוספת תשלום
          </Button>
        ) : (
          <CoachPaymentCreateDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            active={active}
            queryClient={queryClient}
          />
        )}
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right text-muted-foreground">תאריך תשלום</TableHead>
                <TableHead className="text-right text-muted-foreground">מאמן</TableHead>
                <TableHead className="text-right text-muted-foreground">חודשי כיסוי</TableHead>
                <TableHead className="text-right text-muted-foreground">סכום</TableHead>
                <TableHead className="text-right text-muted-foreground">הערות</TableHead>
                <TableHead className="w-[100px] text-right text-muted-foreground">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow className="border-border/50">
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    אין תשלומי מאמנים. הוסיפו תשלום ראשון.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => {
                  const pd = parseDateOnlyFromForm(p.paymentDateIso);
                  const dateStr = pd ? formatDateOnlyToDisplay(pd) : p.paymentDateIso;
                  return (
                    <TableRow key={p.id} className="border-border/50 hover:bg-muted/40">
                      <TableCell className="text-foreground">{dateStr}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {p.instructorName}
                      </TableCell>
                      <TableCell className="max-w-[min(28rem,50vw)]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block cursor-default truncate text-muted-foreground">
                              {p.coverageSummary}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="whitespace-pre-wrap">{p.coverageSummary}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        ₪{p.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-muted-foreground">
                        {p.notes ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setDetailPayment(p)}
                            title="צפייה"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setEditPayment(p)}
                            title="עריכה"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirmId(p.id)}
                            title="מחיקה"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailPayment} onOpenChange={(o) => !o && setDetailPayment(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">פרטי תשלום מאמן</DialogTitle>
          </DialogHeader>
          {detailPayment && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="text-muted-foreground">מאמן:</span>
                <span className="text-foreground font-medium">{detailPayment.instructorName}</span>
                <span className="text-muted-foreground">תאריך תשלום:</span>
                <span className="text-foreground">
                  {parseDateOnlyFromForm(detailPayment.paymentDateIso)
                    ? formatDateOnlyToDisplay(
                        parseDateOnlyFromForm(detailPayment.paymentDateIso)!
                      )
                    : detailPayment.paymentDateIso}
                </span>
                <span className="text-muted-foreground">סכום:</span>
                <span className="text-foreground font-semibold text-lg">
                  ₪{detailPayment.amount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">חודשי כיסוי:</span>
                <ul className="mt-2 list-disc list-inside text-foreground space-y-1">
                  {detailPayment.coveredMonthLabels.map((label, i) => (
                    <li key={i}>{label}</li>
                  ))}
                </ul>
              </div>
              {detailPayment.notes && (
                <div>
                  <span className="text-muted-foreground">הערות:</span>
                  <p className="mt-1 text-foreground whitespace-pre-wrap">{detailPayment.notes}</p>
                </div>
              )}
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setDetailPayment(null)}>
                  סגור
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editPayment && (
        <CoachPaymentEditDialog
          payment={editPayment}
          open={!!editPayment}
          onOpenChange={(o) => {
            if (!o) setEditPayment(null);
          }}
          queryClient={queryClient}
        />
      )}

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(o) => {
          if (!o && deletePhase === "refreshing") return;
          if (!o) {
            setDeleteConfirmId(null);
            setDeletePhase("idle");
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">מחיקת תשלום מאמן</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {deletePhase === "refreshing"
                ? "מעדכן נתונים..."
                : deletePhase === "success"
                  ? "הרשומה נמחקה בהצלחה"
                  : "האם אתה בטוח שברצונך למחוק תשלום זה? פעולה זו אינה ניתנת לביטול."}
            </DialogDescription>
          </DialogHeader>
          {deletePhase === "refreshing" ? (
            <div
              className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 dark:text-blue-400"
              role="status"
            >
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
              מעדכן נתונים...
            </div>
          ) : deletePhase === "success" ? (
            <div className="flex flex-col gap-4 pt-2">
              <div
                className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
                role="status"
              >
                <CheckCircle className="h-5 w-5 shrink-0" />
                הרשומה נמחקה בהצלחה
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeletePhase("idle");
                  }}
                >
                  סגור
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                  ביטול
                </Button>
                <Button
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={deletePending}
                  onClick={async () => {
                    if (!deleteConfirmId) return;
                    setDeletePending(true);
                    const result = await deleteInstructorPayment(deleteConfirmId);
                    setDeletePending(false);
                    if (result.success) {
                      setDeletePhase("refreshing");
                      try {
                        await invalidateInstructorPaymentsPanelAndDashboardHome(queryClient);
                      } finally {
                        setDeletePhase("success");
                      }
                    }
                  }}
                >
                  {deletePending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      מוחק...
                    </>
                  ) : (
                    "מחק"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

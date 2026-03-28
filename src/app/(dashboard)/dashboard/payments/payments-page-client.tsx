"use client";

import React, { useState, useEffect, useMemo, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as Lucide from "lucide-react";
import { Plus, Eye, Loader2, Search, Pencil, Trash2, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";

const ChevronUp = (Lucide as Record<string, React.ComponentType<{ className?: string }>>).ChevronUp;
const ChevronDown = (Lucide as Record<string, React.ComponentType<{ className?: string }>>).ChevronDown;
import { createPayment } from "@/server/actions/create-payment";
import {
  getStudentsForPaymentSelector,
  type StudentOption,
} from "@/server/actions/get-students-for-payment-selector";
import { PaymentStudentSelect } from "@/components/payments/PaymentStudentSelect";
import {
  ListLoadingBanner,
  PaymentsListSkeletonTable,
  LIST_PAGE_SHIMMER_CLASS,
} from "@/components/dashboard/dashboard-loading-skeleton";
import { cn } from "@/lib/utils";
import {
  updatePayment,
  type UpdatePaymentState,
} from "@/server/actions/update-payment";
import {
  deletePayment,
  type DeletePaymentState,
} from "@/server/actions/delete-payment";
import { formNativeSelectClassName } from "@/lib/form-field";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getPaymentTypeLabel,
  getMonthlySubtypeLabel,
  getPaymentMethodLabel,
} from "@/lib/payment-types";
import type { PaymentType, MonthlyPaymentSubtype, PaymentMethod } from "@prisma/client";
import Link from "next/link";
import { todayLocalCalendarIso } from "@/lib/date-only";
import {
  RECORD_DIALOG_AUTOCLOSE_MS,
  type RecordSaveTailPhase,
  RecordDialogCancelButton,
  RecordDialogPrimarySubmitButton,
  RecordDialogSaveTailBanners,
  recordDialogBlockDismiss,
  useRecordDialogPostSavePhase,
  useWrappedFormState,
} from "@/components/record-dialog/record-dialog-save-ux";
import { usePaymentsPageQuery } from "@/hooks/use-payments-page-query";
import type {
  PaymentsPageQueryScope,
  PaymentListRow,
  PaymentsSystemDataRow,
  PaymentsPageListParams,
} from "@/types/payments-page";
import {
  invalidatePaymentsPageAndDashboardHome,
  invalidatePaymentsPageQueries,
} from "@/lib/payments-page-query";

type PaymentRow = PaymentListRow;
type SystemDataRow = PaymentsSystemDataRow;

type Props = {
  queryScope: PaymentsPageQueryScope;
};

const MONTHS_HE = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function PaymentsPageClient({ queryScope }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const listParams = useMemo((): PaymentsPageListParams => {
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const search = (searchParams.get("search") ?? "").trim();
    const filterType = searchParams.get("filterType") ?? "";
    const filterSubtype = searchParams.get("filterSubtype") ?? "";
    return { page, search, filterType, filterSubtype };
  }, [searchParams]);

  const syncPaymentsCache = useCallback(async () => {
    await invalidatePaymentsPageQueries(queryClient);
  }, [queryClient]);

  const {
    data,
    isError,
    error,
    refetch,
    isPending: paymentsQueryPending,
    isFetching: paymentsQueryFetching,
  } = usePaymentsPageQuery({ scope: queryScope, listParams });

  const payments = data?.payments ?? [];
  const sportsEquipment = data?.sportsEquipment ?? [];
  const exams = data?.exams ?? [];
  const totalCount = data?.totalCount ?? 0;
  const currentPage = data?.currentPage ?? 1;
  const pageSize = data?.pageSize ?? 25;
  const totalPages = data?.totalPages ?? 1;

  const loadingWithoutData = paymentsQueryPending && !data;
  const [createOpen, setCreateOpen] = useState(false);
  const createSuccessHandledRef = React.useRef(false);
  const { state, formAction, submitBusy } = useWrappedFormState(createPayment, null);
  const { tailPhase: createPhase } = useRecordDialogPostSavePhase({
    success: state?.success,
    successVersion: state?._ts,
    isOpen: createOpen,
    handledRef: createSuccessHandledRef,
    onAutoClose: () => {
      setCreateOpen(false);
      setPaymentType("");
      setMonthlySubtype("");
      setSelectedMonths([]);
      setEquipmentRows([{ code: "", quantity: 1 }]);
      setEquipmentAmount("");
      setExamAmount("");
      setSelectedExamCode("");
    },
    syncOnSuccess: syncPaymentsCache,
  });
  const [createFormKey, setCreateFormKey] = useState(0);
  const [paymentType, setPaymentType] = useState<PaymentType | "">("");
  const [monthlySubtype, setMonthlySubtype] = useState<MonthlyPaymentSubtype | "">("");
  const [selectedMonths, setSelectedMonths] = useState<{ year: number; month: number }[]>([]);
  const [equipmentRows, setEquipmentRows] = useState<{ code: string; quantity: number }[]>([
    { code: "", quantity: 1 },
  ]);
  const [equipmentAmount, setEquipmentAmount] = useState("");
  const [examAmount, setExamAmount] = useState("");
  const [selectedExamCode, setSelectedExamCode] = useState("");
  const [prefillStudentId, setPrefillStudentId] = useState<string | null>(null);
  const deepLinkConsumedRef = React.useRef(false);

  const resetCreateFormState = React.useCallback(() => {
    createSuccessHandledRef.current = false;
    setPaymentType("");
    setMonthlySubtype("");
    setSelectedMonths([]);
    setEquipmentRows([{ code: "", quantity: 1 }]);
    setEquipmentAmount("");
    setExamAmount("");
    setSelectedExamCode("");
    setSelectorStudents([]);
    setSelectorStudentsLoading(false);
    setCreateFormKey((k) => k + 1);
  }, []);
  const [detailPayment, setDetailPayment] = useState<PaymentRow | null>(null);
  const filterPaymentType = (listParams.filterType as PaymentType | "") || "";
  const filterMonthlySubtype =
    (listParams.filterSubtype as MonthlyPaymentSubtype | "") || "";
  const [editPayment, setEditPayment] = useState<PaymentRow | null>(null);
  const [selectorStudents, setSelectorStudents] = useState<StudentOption[]>([]);
  const [selectorStudentsLoading, setSelectorStudentsLoading] = useState(false);

  useEffect(() => {
    if (createOpen && selectorStudents.length === 0 && !selectorStudentsLoading) {
      setSelectorStudentsLoading(true);
      getStudentsForPaymentSelector().then((list) => {
        setSelectorStudents(list);
        setSelectorStudentsLoading(false);
      });
    }
  }, [createOpen, selectorStudents.length, selectorStudentsLoading]);

  useEffect(() => {
    if (searchParams.get("openCreate") !== "1") {
      deepLinkConsumedRef.current = false;
      return;
    }
    if (deepLinkConsumedRef.current) return;
    deepLinkConsumedRef.current = true;

    const pt = searchParams.get("paymentType");
    const sidRaw = searchParams.get("studentId");
    const sid = sidRaw?.trim() ? sidRaw.trim() : null;

    if (pt === "MONTHLY" || pt === null) {
      setPaymentType("MONTHLY");
      setMonthlySubtype("");
      setSelectedMonths([]);
      setEquipmentRows([{ code: "", quantity: 1 }]);
      setEquipmentAmount("");
      setExamAmount("");
      setSelectedExamCode("");
    }
    setPrefillStudentId(sid);

    setCreateOpen(true);

    const next = new URLSearchParams(searchParams.toString());
    next.delete("openCreate");
    next.delete("paymentType");
    next.delete("studentId");
    const qs = next.toString();
    router.replace(qs ? `/dashboard/payments?${qs}` : "/dashboard/payments", { scroll: false });
  }, [searchParams, router]);

  const [editSuccessPendingRefresh, setEditSuccessPendingRefresh] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deletePhase, setDeletePhase] = useState<"idle" | "refreshing" | "success">("idle");
  const [updateState, setUpdateState] = useState<UpdatePaymentState | null>(null);
  const [deleteState, setDeleteState] = useState<DeletePaymentState | null>(null);
  type SortColumn = "date" | "studentId" | "studentName" | "center" | "group" | "type" | "amount" | "months";
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const currentYear = new Date().getFullYear();

  const sortedPayments = useMemo(() => {
    if (!sortColumn) return payments;
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...payments].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "date":
          cmp =
            (a.paymentDateIso ?? "").localeCompare(b.paymentDateIso ?? "") ||
            (a.paymentDate ?? "").localeCompare(b.paymentDate ?? "");
          break;
        case "studentId":
          cmp = (a.studentIdentifier ?? "").localeCompare(b.studentIdentifier ?? "");
          break;
        case "studentName":
          cmp = (a.studentName ?? "").localeCompare(b.studentName ?? "");
          break;
        case "center":
          cmp = (a.centerName ?? "").localeCompare(b.centerName ?? "");
          break;
        case "group":
          cmp = (a.groupName ?? "").localeCompare(b.groupName ?? "");
          break;
        case "type":
          cmp =
            getPaymentTypeLabel(a.paymentType).localeCompare(
              getPaymentTypeLabel(b.paymentType)
            ) ||
            getMonthlySubtypeLabel(a.monthlySubtype).localeCompare(
              getMonthlySubtypeLabel(b.monthlySubtype)
            );
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "months":
          cmp = (a.months?.join(",") ?? "").localeCompare(b.months?.join(",") ?? "");
          break;
        default:
          return 0;
      }
      return cmp * dir;
    });
  }, [payments, sortColumn, sortDirection]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const SortHeader = ({
    col,
    label,
    className,
  }: {
    col: SortColumn;
    label: string;
    className?: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none text-right text-muted-foreground hover:text-foreground ${className ?? ""}`}
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center justify-end gap-1">
        {label}
        {sortColumn === col ? (
          sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50" />
        )}
      </span>
    </TableHead>
  );

  useEffect(() => {
    if (!editSuccessPendingRefresh) return;
    const t = setTimeout(() => {
      setEditPayment(null);
      setUpdateState(null);
      setEditSuccessPendingRefresh(false);
    }, RECORD_DIALOG_AUTOCLOSE_MS);
    return () => clearTimeout(t);
  }, [editSuccessPendingRefresh]);


  useEffect(() => {
    if (deletePhase === "success") {
      const t = setTimeout(() => {
        setDeleteConfirmId(null);
        setDeletePhase("idle");
      }, RECORD_DIALOG_AUTOCLOSE_MS);
      return () => clearTimeout(t);
    }
  }, [deletePhase]);

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

  const addEquipmentRow = () => {
    setEquipmentRows((prev) => [...prev, { code: "", quantity: 1 }]);
  };

  const removeEquipmentRow = (idx: number) => {
    if (equipmentRows.length <= 1) return;
    setEquipmentRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateEquipmentRow = (idx: number, code: string, quantity: number) => {
    setEquipmentRows((prev) =>
      prev.map((r, i) => (i === idx ? { code, quantity } : r))
    );
  };

  const getEquipmentDescription = (code: string) =>
    sportsEquipment.find((e) => e.code === code)?.description ?? code;

  const getEquipmentAmount = (code: string) =>
    sportsEquipment.find((e) => e.code === code)?.amount ?? 0;

  const getExamDescription = (code: string) =>
    exams.find((e) => e.code === code)?.description ?? code;

  const getExamAmount = (code: string) =>
    exams.find((e) => e.code === code)?.amount ?? 0;

  const equipmentCalculatedTotal = useMemo(() => {
    return equipmentRows.reduce((sum, r) => {
      if (!r.code) return sum;
      const unit = getEquipmentAmount(r.code);
      return sum + unit * r.quantity;
    }, 0);
  }, [equipmentRows, sportsEquipment]);

  useEffect(() => {
    if (paymentType === "EQUIPMENT") {
      setEquipmentAmount(equipmentCalculatedTotal > 0 ? equipmentCalculatedTotal.toFixed(2) : "");
    }
  }, [paymentType, equipmentCalculatedTotal]);

  const monthlyStudents = selectorStudents.filter((s) => s.hasActiveMembership);

  if (isError && !data) {
    return (
      <TooltipProvider>
        <Card className="border-destructive/30 bg-card">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-destructive" role="alert">
              {error instanceof Error ? error.message : "שגיאה בטעינת התשלומים"}
            </p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  if (loadingWithoutData) {
    return (
      <TooltipProvider>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-muted-foreground">היסטוריית תשלומים</h2>
          <Button type="button" disabled className="bg-dojo-red/50">
            <Plus className="ml-2 h-4 w-4" />
            הוספת תשלום
          </Button>
        </div>
        <div className="space-y-6">
          <ListLoadingBanner
            title="טוען נתוני תשלומים..."
            subtitle="אנא המתן — טוענים היסטוריית תשלומים וסינונים"
          />
          <div
            className={cn(
              "h-10 max-w-xs rounded-md border border-border/60",
              LIST_PAGE_SHIMMER_CLASS
            )}
          />
          <PaymentsListSkeletonTable />
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-foreground">היסטוריית תשלומים</h2>
        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            if (!open && recordDialogBlockDismiss(createPhase, submitBusy)) return;
            setCreateOpen(open);
            if (open) {
              createSuccessHandledRef.current = false;
            }
            if (!open) {
              setPrefillStudentId(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              type="button"
              className="bg-dojo-red hover:bg-dojo-red/90"
              onClick={() => resetCreateFormState()}
            >
              <Plus className="ml-2 h-4 w-4" />
              הוספת תשלום
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">הוספת תשלום</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                בחר סוג תשלום והזן את הפרטים
              </DialogDescription>
            </DialogHeader>
            <form
              key={`create-form-${createFormKey}`}
              action={formAction}
              className="grid gap-4 py-4"
              onSubmit={() => {
                createSuccessHandledRef.current = false;
              }}
              {...(createPhase !== "idle" || submitBusy ? { "aria-busy": true } : {})}
            >
              <fieldset
                disabled={submitBusy || createPhase !== "idle"}
                className="contents"
              >
              <input type="hidden" name="paymentType" value={paymentType} />
              <input type="hidden" name="monthlySubtype" value={monthlySubtype} />
              <input
                type="hidden"
                name="months"
                value={JSON.stringify(selectedMonths.filter((m) => m.year && m.month))}
              />
              <input
                type="hidden"
                name="equipmentItems"
                value={JSON.stringify(
                  equipmentRows.filter((r) => r.code).map((r) => ({ code: r.code, quantity: r.quantity }))
                )}
              />

              <div className="grid gap-2">
                <Label>סוג תשלום</Label>
                <select
                  required
                  value={paymentType}
                  onChange={(e) => {
                    setPaymentType(e.target.value as PaymentType | "");
                    setMonthlySubtype("");
                    setSelectedMonths([]);
                    setEquipmentRows([{ code: "", quantity: 1 }]);
                    setEquipmentAmount("");
                    setExamAmount("");
                    setSelectedExamCode("");
                  }}
                  className={formNativeSelectClassName()}
                >
                  <option value="">בחר סוג</option>
                  <option value="MONTHLY">חודשי</option>
                  <option value="EQUIPMENT">ציוד</option>
                  <option value="EXAM">מבחן</option>
                </select>
              </div>

              {paymentType && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="studentId-trigger">תלמיד *</Label>
                    <PaymentStudentSelect
                      id="studentId"
                      resetKey={`${createFormKey}-${paymentType}`}
                      students={
                        paymentType === "MONTHLY" ? monthlyStudents : selectorStudents
                      }
                      loading={selectorStudentsLoading}
                      disabled={submitBusy || createPhase !== "idle"}
                      initialStudentId={prefillStudentId}
                    />
                    {paymentType === "MONTHLY" &&
                      !selectorStudentsLoading &&
                      monthlyStudents.length === 0 && (
                      <p className="text-xs text-amber-500">אין תלמידים עם מנוי פעיל</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentDate">תאריך תשלום *</Label>
                    <Input
                      id="paymentDate"
                      name="paymentDate"
                      type="date"
                      required
                      defaultValue={todayLocalCalendarIso()}
                    />
                  </div>

                  {paymentType === "MONTHLY" && (
                    <>
                      <div className="grid gap-2">
                        <Label>סוג תשלום חודשי</Label>
                        <select
                          value={monthlySubtype}
                          onChange={(e) =>
                            setMonthlySubtype(e.target.value as MonthlyPaymentSubtype | "")
                          }
                          className={formNativeSelectClassName()}
                        >
                          <option value="">בחר</option>
                          <option value="REGULAR">תשלום רגיל</option>
                          <option value="CHECK">המחאה</option>
                          <option value="WAIVER">פטור מתשלום</option>
                        </select>
                      </div>

                      {monthlySubtype && (
                        <>
                          {monthlySubtype === "REGULAR" && (
                            <>
                              <div className="grid gap-2">
                                <Label htmlFor="amount">סכום *</Label>
                                <Input
                                  id="amount"
                                  name="amount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="paymentMethod">אמצעי תשלום *</Label>
                                <select
                                  id="paymentMethod"
                                  name="paymentMethod"
                                  required={monthlySubtype === "REGULAR"}
                                  className={formNativeSelectClassName()}
                                >
                                  <option value="">בחר</option>
                                  <option value="bit">ביט</option>
                                  <option value="paybox">פייבוקס</option>
                                  <option value="cash">מזומן</option>
                                  <option value="bank_transfer">העברה בנקאית</option>
                                </select>
                              </div>
                            </>
                          )}

                          {monthlySubtype === "CHECK" && (
                            <>
                              <div className="grid gap-2">
                                <Label htmlFor="amount">סכום *</Label>
                                <Input
                                  id="amount"
                                  name="amount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="bankNumber">מספר בנק *</Label>
                                <Input
                                  id="bankNumber"
                                  name="bankNumber"
                                  placeholder="מספר בנק"
                                  required
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="checkNumber">מספר צ׳ק *</Label>
                                <Input
                                  id="checkNumber"
                                  name="checkNumber"
                                  placeholder="מספר צ׳ק"
                                  required
                                />
                              </div>
                            </>
                          )}

                          {monthlySubtype === "WAIVER" && (
                            <>
                              <input type="hidden" name="amount" value="0" />
                              <div className="grid gap-2">
                                <Label htmlFor="waiverReason">סיבת הפטור</Label>
                                <Input
                                  id="waiverReason"
                                  name="waiverReason"
                                  placeholder="למשל: מילואים, הקפאה..."
                                />
                              </div>
                            </>
                          )}

                          <div className="grid gap-2">
                            <div className="flex justify-between">
                              <Label>חודשים *</Label>
                              <Button type="button" variant="ghost" size="sm" onClick={addMonth}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {selectedMonths.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                לחץ + להוספת חודש
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {selectedMonths.map((m, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <select
                                      value={m.year}
                                      onChange={(e) =>
                                        updateMonth(idx, parseInt(e.target.value), m.month)
                                      }
                                      className={formNativeSelectClassName(
                                        "h-9 w-auto shrink-0 px-2"
                                      )}
                                    >
                                      {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                                        <option
                                          key={y}
                                          value={y}
                                          disabled={isMonthTaken(y, m.month, idx)}
                                        >
                                          {y}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={m.month}
                                      onChange={(e) =>
                                        updateMonth(idx, m.year, parseInt(e.target.value))
                                      }
                                      className={formNativeSelectClassName(
                                        "min-w-0 flex-1 px-2"
                                      )}
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
                                    >
                                      ×
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {paymentType === "EQUIPMENT" && (
                    <>
                      <div className="grid gap-2">
                        <div className="flex justify-between">
                          <Label>פריטי ציוד *</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={addEquipmentRow}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {equipmentRows.map((r, idx) => {
                            const unitAmount = r.code ? getEquipmentAmount(r.code) : 0;
                            const lineTotal = unitAmount * r.quantity;
                            return (
                              <div key={idx} className="flex flex-wrap items-center gap-2 rounded border border-border p-2">
                                <select
                                  value={r.code}
                                  onChange={(e) =>
                                    updateEquipmentRow(idx, e.target.value, r.quantity)
                                  }
                                  className={formNativeSelectClassName(
                                    "min-w-0 flex-1 px-2"
                                  )}
                                >
                                  <option value="">בחר פריט</option>
                                  {sportsEquipment.map((e) => (
                                    <option key={e.id} value={e.code}>
                                      {e.code} - {e.description}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-muted-foreground text-sm whitespace-nowrap">
                                  ₪{unitAmount.toFixed(2)} ×
                                </span>
                                <Input
                                  type="number"
                                  min="1"
                                  value={r.quantity}
                                  onChange={(e) =>
                                    updateEquipmentRow(idx, r.code, parseInt(e.target.value) || 1)
                                  }
                                  className="w-16"
                                />
                                <span className="text-foreground font-medium whitespace-nowrap">
                                  = ₪{lineTotal.toFixed(2)}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeEquipmentRow(idx)}
                                  disabled={equipmentRows.length <= 1}
                                >
                                  ×
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="rounded border border-border bg-muted/50 px-3 py-2 text-sm">
                          <span className="text-muted-foreground">סה״כ חושב: </span>
                          <span className="font-medium text-foreground">
                            ₪{equipmentCalculatedTotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="amount">סכום כולל *</Label>
                          <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={equipmentAmount}
                            onChange={(e) => setEquipmentAmount(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="equipmentNotes">הערות</Label>
                          <Textarea
                            id="equipmentNotes"
                            name="equipmentNotes"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {paymentType === "EXAM" && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="examCode">סוג מבחן *</Label>
                        <select
                          id="examCode"
                          name="examCode"
                          value={selectedExamCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            setSelectedExamCode(code);
                            setExamAmount(code ? getExamAmount(code).toFixed(2) : "");
                          }}
                          required
                          className={formNativeSelectClassName()}
                        >
                          <option value="">בחר סוג</option>
                          {exams.map((e) => (
                            <option key={e.id} value={e.code}>
                              {e.code} - {e.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="amount">סכום *</Label>
                        <Input
                          id="amount"
                          name="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={examAmount}
                          onChange={(e) => setExamAmount(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="examDate">תאריך מבחן *</Label>
                        <Input
                          id="examDate"
                          name="examDate"
                          type="date"
                          required
                          defaultValue={todayLocalCalendarIso()}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <RecordDialogSaveTailBanners phase={createPhase} />
              {state?.error && (
                <p className="text-sm text-destructive" role="alert">
                  {state.error}
                </p>
              )}

              <div className="flex justify-start gap-2 pt-2">
                {createPhase === "idle" && paymentType && (
                  <>
                    <RecordDialogPrimarySubmitButton />
                    <RecordDialogCancelButton onClick={() => setCreateOpen(false)} />
                  </>
                )}
              </div>
              </fieldset>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <form
          action="/dashboard/payments"
          method="get"
          className="relative flex-1 max-w-xs"
        >
          <input type="hidden" name="page" value="1" />
          <input
            type="hidden"
            name="filterType"
            value={filterPaymentType || ""}
          />
          <input
            type="hidden"
            name="filterSubtype"
            value={filterPaymentType === "MONTHLY" ? filterMonthlySubtype : ""}
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            name="search"
            placeholder="חיפוש (ת״ז, שם, מרכז, קבוצה, סוג)"
            defaultValue={listParams.search}
            key={`${listParams.search}-${listParams.filterType}-${listParams.filterSubtype}`}
            className="pr-9"
          />
          <button type="submit" className="sr-only">
            חפש
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterPaymentType}
            onChange={(e) => {
              const val = e.target.value as PaymentType | "";
              const qs = new URLSearchParams();
              qs.set("page", "1");
              if (listParams.search) qs.set("search", listParams.search);
              if (val) qs.set("filterType", val);
              startTransition(() =>
                router.push(`/dashboard/payments?${qs.toString()}`)
              );
            }}
            className={formNativeSelectClassName()}
          >
            <option value="">סוג תשלום</option>
            <option value="MONTHLY">חודשי</option>
            <option value="EQUIPMENT">ציוד</option>
            <option value="EXAM">מבחן</option>
          </select>
          {filterPaymentType === "MONTHLY" && (
            <select
              value={filterMonthlySubtype}
              onChange={(e) => {
                const val = e.target.value as MonthlyPaymentSubtype | "";
                const qs = new URLSearchParams();
                qs.set("page", "1");
                if (listParams.search) qs.set("search", listParams.search);
                qs.set("filterType", "MONTHLY");
                if (val) qs.set("filterSubtype", val);
                startTransition(() =>
                  router.push(`/dashboard/payments?${qs.toString()}`)
                );
              }}
              className={formNativeSelectClassName()}
            >
              <option value="">סוג חודשי</option>
              <option value="REGULAR">תשלום רגיל</option>
              <option value="CHECK">המחאה</option>
              <option value="WAIVER">פטור מתשלום</option>
            </select>
          )}
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <SortHeader col="date" label="תאריך" />
                <SortHeader col="studentId" label="ת״ז" />
                <SortHeader col="studentName" label="שם" />
                <SortHeader col="center" label="מרכז" />
                <SortHeader col="group" label="קבוצה" />
                <SortHeader col="type" label="סוג" />
                <SortHeader col="months" label="חודשים" />
                <SortHeader col="amount" label="סכום" />
                <TableHead className="w-[100px] text-right text-muted-foreground">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.length === 0 ? (
                <TableRow className="border-border/50">
                  <TableCell
                    colSpan={10}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {totalCount === 0
                      ? "אין תשלומים במערכת. הוסף תשלום ראשון."
                      : "לא נמצאו תשלומים התואמים לחיפוש או לסינון."}
                  </TableCell>
                </TableRow>
              ) : (
                sortedPayments.map((p) => {
                  const monthsText =
                    p.paymentType === "MONTHLY" && p.months?.length
                      ? p.months.join(", ")
                      : "-";
                  return (
                    <TableRow
                      key={p.id}
                      className="border-border/50 hover:bg-muted/40"
                    >
                      <TableCell className="text-foreground">{p.paymentDate}</TableCell>
                      <TableCell className="font-mono text-foreground">
                        {p.studentIdentifier}
                      </TableCell>
                      <TableCell className="text-foreground">{p.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.centerName ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.groupName ?? "-"}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {getPaymentTypeLabel(p.paymentType)}
                        {p.monthlySubtype &&
                          ` (${getMonthlySubtypeLabel(p.monthlySubtype)})`}
                      </TableCell>
                      <TableCell className="max-w-[120px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="block truncate text-muted-foreground cursor-default"
                              title={monthsText}
                            >
                              {monthsText}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="whitespace-pre-wrap">{monthsText}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        ₪{p.amount.toFixed(2)}
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

      {totalPages > 1 && (() => {
        const paginationQs = (p: number) => {
          const qs = new URLSearchParams();
          qs.set("page", String(p));
          if (listParams.search) qs.set("search", listParams.search);
          if (listParams.filterType) qs.set("filterType", listParams.filterType);
          if (listParams.filterType === "MONTHLY" && listParams.filterSubtype) {
            qs.set("filterSubtype", listParams.filterSubtype);
          }
          return `/dashboard/payments?${qs.toString()}`;
        };
        return (
        <div className="mt-4 flex flex-row-reverse items-center justify-between gap-4 border-t border-border pt-4">
          <div className="text-sm text-muted-foreground">
            עמוד {currentPage} מתוך {totalPages}
            <span className="me-2 ms-2">•</span>
            {totalCount} תשלומים
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
              className="border-border bg-card text-foreground hover:bg-muted/80 hover:text-foreground"
            >
              {currentPage > 1 ? (
                <Link href={paginationQs(currentPage - 1)}>
                  <ChevronRight className="ml-1 h-4 w-4" />
                  הקודם
                </Link>
              ) : (
                <>
                  <ChevronRight className="ml-1 h-4 w-4" />
                  הקודם
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
              className="border-border bg-card text-foreground hover:bg-muted/80 hover:text-foreground"
            >
              {currentPage < totalPages ? (
                <Link href={paginationQs(currentPage + 1)}>
                  הבא
                  <ChevronLeft className="mr-1 h-4 w-4" />
                </Link>
              ) : (
                <>
                  הבא
                  <ChevronLeft className="mr-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        );
      })()}

      <Dialog open={!!detailPayment} onOpenChange={(o) => !o && setDetailPayment(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg">פרטי תשלום</DialogTitle>
          </DialogHeader>
          {detailPayment && (
            <div className="space-y-6 text-base">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="mb-3 text-base font-medium text-foreground">פרטים כלליים</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <span className="text-muted-foreground">תאריך:</span>
                  <span className="text-foreground">{detailPayment.paymentDate}</span>
                  <span className="text-muted-foreground">ת״ז:</span>
                  <span className="text-foreground font-mono">{detailPayment.studentIdentifier}</span>
                  <span className="text-muted-foreground">שם:</span>
                  <span className="text-foreground">{detailPayment.studentName}</span>
                  <span className="text-muted-foreground">מרכז:</span>
                  <span className="text-foreground">{detailPayment.centerName ?? "-"}</span>
                  <span className="text-muted-foreground">קבוצה:</span>
                  <span className="text-foreground">{detailPayment.groupName ?? "-"}</span>
                  <span className="text-muted-foreground">סוג:</span>
                  <span className="text-foreground">
                    {getPaymentTypeLabel(detailPayment.paymentType)}
                    {detailPayment.monthlySubtype &&
                      ` - ${getMonthlySubtypeLabel(detailPayment.monthlySubtype)}`}
                  </span>
                  <span className="text-muted-foreground">סכום:</span>
                  <span className="text-foreground font-semibold text-lg">
                    ₪{detailPayment.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {detailPayment.paymentType === "MONTHLY" && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="mb-3 text-base font-medium text-foreground">פרטי תשלום חודשי</h3>
                  <div className="space-y-3">
                    {detailPayment.paymentMethod && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-muted-foreground">אמצעי תשלום:</span>
                        <span className="text-foreground">
                          {getPaymentMethodLabel(detailPayment.paymentMethod)}
                        </span>
                      </div>
                    )}
                    {detailPayment.bankNumber && detailPayment.checkNumber && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-muted-foreground">בנק:</span>
                        <span className="text-foreground">{detailPayment.bankNumber}</span>
                        <span className="text-muted-foreground">צ׳ק:</span>
                        <span className="text-foreground">{detailPayment.checkNumber}</span>
                      </div>
                    )}
                    {detailPayment.waiverReason && (
                      <div>
                        <span className="text-muted-foreground">סיבת פטור:</span>
                        <p className="mt-1 text-foreground">{detailPayment.waiverReason}</p>
                      </div>
                    )}
                    {detailPayment.months.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">חודשים:</span>
                        <ul className="mt-2 space-y-1 text-foreground">
                          {detailPayment.months.map((m, idx) => (
                            <li key={idx} className="font-mono">
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailPayment.paymentType === "EQUIPMENT" &&
                detailPayment.equipmentItems.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4">
                    <h3 className="mb-3 text-base font-medium text-foreground">פריטי ציוד</h3>
                    <ul className="space-y-2">
                      {detailPayment.equipmentItems.map((i, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between gap-4 rounded border border-border/50 px-3 py-2"
                        >
                          <span className="text-foreground">
                            {getEquipmentDescription(i.code)} × {i.quantity}
                          </span>
                          {i.unitAmountSnapshot != null ? (
                            <span className="text-foreground font-medium">
                              ₪{(i.unitAmountSnapshot * i.quantity).toFixed(2)}
                              <span className="mr-1 text-muted-foreground text-sm">
                                (₪{i.unitAmountSnapshot.toFixed(2)} ליחידה)
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    {detailPayment.equipmentNotes && (
                      <p className="mt-3 text-muted-foreground">
                        הערות: {detailPayment.equipmentNotes}
                      </p>
                    )}
                  </div>
                )}

              {detailPayment.paymentType === "EXAM" && detailPayment.examCode && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <h3 className="mb-3 text-base font-medium text-foreground">פרטי מבחן</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <span className="text-muted-foreground">סוג מבחן:</span>
                    <span className="text-foreground">
                      {getExamDescription(detailPayment.examCode)}
                    </span>
                    <span className="text-muted-foreground">תאריך מבחן:</span>
                    <span className="text-foreground">{detailPayment.examDate ?? "-"}</span>
                  </div>
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

      <EditPaymentDialog
        payment={editPayment}
        onClose={() => {
          setEditPayment(null);
          setUpdateState(null);
          setEditSuccessPendingRefresh(false);
        }}
        onSuccessRequested={async () => {
          await invalidatePaymentsPageAndDashboardHome(queryClient);
          setEditSuccessPendingRefresh(true);
        }}
        isRefreshing={paymentsQueryFetching}
        onResult={setUpdateState}
        updateState={updateState}
        students={selectorStudents}
        monthlyStudents={monthlyStudents}
        sportsEquipment={sportsEquipment}
        exams={exams}
        currentYear={currentYear}
        MONTHS_HE={MONTHS_HE}
        getEquipmentAmount={getEquipmentAmount}
        getEquipmentDescription={getEquipmentDescription}
        getExamAmount={getExamAmount}
        isMonthTaken={isMonthTaken}
      />

      <Dialog
        open={!!deleteConfirmId}
        onOpenChange={(o) => {
          if (!o && deletePhase === "refreshing") return;
          if (!o) {
            setDeleteConfirmId(null);
            setDeletePhase("idle");
            setDeleteState(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">מחיקת תשלום</DialogTitle>
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
                    setDeleteState(null);
                    const result = await deletePayment(deleteConfirmId);
                    setDeleteState(result);
                    setDeletePending(false);
                    if (result.success) {
                      setDeletePhase("refreshing");
                      try {
                        await invalidatePaymentsPageAndDashboardHome(queryClient);
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
                    "מחיקה"
                  )}
                </Button>
              </div>
              {deleteState?.error && (
                <p className="text-sm text-destructive" role="alert">
                  {deleteState.error}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function EditPaymentDialog({
  payment,
  onClose,
  onSuccessRequested,
  isRefreshing,
  onResult,
  updateState,
  students,
  monthlyStudents,
  sportsEquipment,
  exams,
  currentYear,
  MONTHS_HE,
  getEquipmentAmount,
  getEquipmentDescription,
  getExamAmount,
  isMonthTaken,
}: {
  payment: PaymentRow | null;
  onClose: () => void;
  onSuccessRequested: () => void;
  isRefreshing: boolean;
  onResult: (r: UpdatePaymentState) => void;
  updateState: UpdatePaymentState | null;
  students: StudentOption[];
  monthlyStudents: StudentOption[];
  sportsEquipment: SystemDataRow[];
  exams: SystemDataRow[];
  currentYear: number;
  MONTHS_HE: string[];
  getEquipmentAmount: (code: string) => number;
  getEquipmentDescription: (code: string) => string;
  getExamAmount: (code: string) => number;
  isMonthTaken: (year: number, month: number, excludeIdx: number) => boolean;
}) {
  const [editMonthlySubtype, setEditMonthlySubtype] = useState<
    MonthlyPaymentSubtype | ""
  >("");
  const [editMonths, setEditMonths] = useState<{ year: number; month: number }[]>([]);
  const [editEquipmentRows, setEditEquipmentRows] = useState<
    { code: string; quantity: number }[]
  >([{ code: "", quantity: 1 }]);
  const [editEquipmentAmount, setEditEquipmentAmount] = useState("");
  const [editExamAmount, setEditExamAmount] = useState("");
  const [editExamCode, setEditExamCode] = useState("");
  const [updatePending, setUpdatePending] = useState(false);
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (payment) {
      setShowUpdateSuccess(false);
      if (payment.paymentType === "MONTHLY") {
        setEditMonthlySubtype(payment.monthlySubtype ?? "");
        if (payment.months?.length) {
          setEditMonths(
            payment.months.map((s) => {
              const [y, m] = s.split("-").map(Number);
              return { year: y, month: m };
            })
          );
        } else {
          setEditMonths([]);
        }
      }
      if (payment.paymentType === "EQUIPMENT" && payment.equipmentItems?.length) {
        setEditEquipmentRows(
          payment.equipmentItems.map((i) => ({
            code: i.code,
            quantity: i.quantity,
          }))
        );
        setEditEquipmentAmount(String(payment.amount.toFixed(2)));
      } else {
        setEditEquipmentRows([{ code: "", quantity: 1 }]);
        setEditEquipmentAmount("");
      }
      if (payment.paymentType === "EXAM") {
        setEditExamCode(payment.examCode ?? "");
        setEditExamAmount(String(payment.amount.toFixed(2)));
      } else {
        setEditExamCode("");
        setEditExamAmount("");
      }
    }
  }, [payment]);

  const editEquipmentTotal = useMemo(() => {
    return editEquipmentRows.reduce((sum, r) => {
      if (!r.code) return sum;
      return sum + getEquipmentAmount(r.code) * r.quantity;
    }, 0);
  }, [editEquipmentRows, getEquipmentAmount, sportsEquipment]);

  const editEquipmentItemsJson = useMemo(
    () =>
      JSON.stringify(
        editEquipmentRows.filter((r) => r.code).map((r) => ({ code: r.code, quantity: r.quantity }))
      ),
    [editEquipmentRows]
  );

  useEffect(() => {
    if (updateState?.error) {
      setShowUpdateSuccess(false);
    }
  }, [updateState?.error]);

  if (!payment) return null;

  const saveBannerPhase: RecordSaveTailPhase = showUpdateSuccess
    ? isRefreshing
      ? "refreshing"
      : "success"
    : "idle";
  const editFormLocked = updatePending || showUpdateSuccess;

  const addMonth = () => {
    const used = new Set(editMonths.map((m) => `${m.year}-${m.month}`));
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
    setEditMonths((prev) => [...prev, { year: y, month }]);
  };

  return (
    <Dialog open={!!payment} onOpenChange={(o) => !o && !isRefreshing && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">עריכת תשלום</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            עדכון פרטי תשלום - {getPaymentTypeLabel(payment.paymentType)}
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={async (e) => {
            e.preventDefault();
            setUpdatePending(true);
            setShowUpdateSuccess(false);
            const form = e.currentTarget;
            const formData = new FormData(form);
            const result = await updatePayment(payment.id, formData);
            onResult(result);
            setUpdatePending(false);
            if (result.success) {
              setShowUpdateSuccess(true);
              onSuccessRequested();
            }
          }}
          className="grid gap-4 py-4"
        >
          <fieldset
            disabled={editFormLocked}
            className="grid gap-4 border-0 p-0 min-w-0 disabled:pointer-events-none disabled:opacity-60"
          >
          <div className="grid gap-2">
            <Label htmlFor="edit-paymentDate">תאריך תשלום *</Label>
            <Input
              id="edit-paymentDate"
              name="paymentDate"
              type="date"
              required
              defaultValue={payment.paymentDateIso}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-muted-foreground">תלמיד</Label>
            <p className="text-foreground">
              {payment.studentName} ({payment.studentIdentifier})
            </p>
          </div>

          {payment.paymentType === "MONTHLY" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edit-monthlySubtype">סוג תשלום חודשי</Label>
                <select
                  id="edit-monthlySubtype"
                  name="monthlySubtype"
                  value={editMonthlySubtype}
                  onChange={(e) =>
                    setEditMonthlySubtype(e.target.value as MonthlyPaymentSubtype)
                  }
                  className={formNativeSelectClassName()}
                >
                  <option value="REGULAR">תשלום רגיל</option>
                  <option value="CHECK">המחאה</option>
                  <option value="WAIVER">פטור מתשלום</option>
                </select>
              </div>
              {(editMonthlySubtype === "REGULAR" || editMonthlySubtype === "CHECK") && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">סכום *</Label>
                  <Input
                    id="edit-amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={payment.amount.toFixed(2)}
                    required
                  />
                </div>
              )}
              {editMonthlySubtype === "REGULAR" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-paymentMethod">אמצעי תשלום *</Label>
                  <select
                    id="edit-paymentMethod"
                    name="paymentMethod"
                    defaultValue={payment.paymentMethod ?? ""}
                    required
                    className={formNativeSelectClassName()}
                  >
                    <option value="bit">ביט</option>
                    <option value="paybox">פייבוקס</option>
                    <option value="cash">מזומן</option>
                    <option value="bank_transfer">העברה בנקאית</option>
                  </select>
                </div>
              )}
              {editMonthlySubtype === "CHECK" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-bankNumber">מספר בנק *</Label>
                    <Input
                      id="edit-bankNumber"
                      name="bankNumber"
                      defaultValue={payment.bankNumber ?? ""}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-checkNumber">מספר צ׳ק *</Label>
                    <Input
                      id="edit-checkNumber"
                      name="checkNumber"
                      defaultValue={payment.checkNumber ?? ""}
                    />
                  </div>
                </>
              )}
              {editMonthlySubtype === "WAIVER" && (
                <>
                  <input type="hidden" name="amount" value="0" />
                  <div className="grid gap-2">
                    <Label htmlFor="edit-waiverReason">סיבת הפטור</Label>
                    <Input
                      id="edit-waiverReason"
                      name="waiverReason"
                      defaultValue={payment.waiverReason ?? ""}
                    />
                  </div>
                </>
              )}
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label>חודשים *</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addMonth}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {editMonths.length === 0 ? (
                  <p className="text-sm text-muted-foreground">לחץ + להוספת חודש</p>
                ) : (
                  <div className="space-y-2">
                    {editMonths.map((m, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select
                          value={m.year}
                          onChange={(e) =>
                            setEditMonths((prev) =>
                              prev.map((mm, i) =>
                                i === idx
                                  ? { ...mm, year: parseInt(e.target.value) }
                                  : mm
                              )
                            )
                          }
                          className={formNativeSelectClassName(
                            "h-9 w-auto shrink-0 px-2"
                          )}
                        >
                          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <select
                          value={m.month}
                          onChange={(e) =>
                            setEditMonths((prev) =>
                              prev.map((mm, i) =>
                                i === idx
                                  ? { ...mm, month: parseInt(e.target.value) }
                                  : mm
                              )
                            )
                          }
                          className={formNativeSelectClassName(
                            "min-w-0 flex-1 px-2"
                          )}
                        >
                          {MONTHS_HE.map((name, i) => (
                            <option key={i} value={i + 1}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditMonths((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  type="hidden"
                  name="months"
                  value={JSON.stringify(editMonths)}
                />
              </div>
            </>
          )}

          {payment.paymentType === "EQUIPMENT" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label>פריטי ציוד *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditEquipmentRows((prev) => [...prev, { code: "", quantity: 1 }])
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {editEquipmentRows.map((r, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center gap-2 rounded border border-border p-2"
                    >
                      <select
                        name={`equip-code-${idx}`}
                        value={r.code}
                        onChange={(e) =>
                          setEditEquipmentRows((prev) =>
                            prev.map((rr, i) =>
                              i === idx ? { ...rr, code: e.target.value } : rr
                            )
                          )
                        }
                        className={formNativeSelectClassName(
                          "min-w-0 flex-1 px-2"
                        )}
                      >
                        <option value="">בחר פריט</option>
                        {sportsEquipment.map((e) => (
                          <option key={e.id} value={e.code}>
                            {e.code} - {e.description}
                          </option>
                        ))}
                      </select>
                      <span className="text-muted-foreground text-sm">
                        ₪{getEquipmentAmount(r.code).toFixed(2)} ×
                      </span>
                      <Input
                        type="number"
                        min="1"
                        value={r.quantity}
                        onChange={(e) =>
                          setEditEquipmentRows((prev) =>
                            prev.map((rr, i) =>
                              i === idx
                                ? { ...rr, quantity: parseInt(e.target.value) || 1 }
                                : rr
                            )
                          )
                        }
                        className="w-16"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditEquipmentRows((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        disabled={editEquipmentRows.length <= 1}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-equipmentAmount">תשלום כולל *</Label>
                  <Input
                    id="edit-equipmentAmount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editEquipmentAmount}
                    onChange={(e) => setEditEquipmentAmount(e.target.value)}
                    required
                  />
                  {editEquipmentRows.some((r) => r.code) && (
                    <p className="text-sm text-muted-foreground">
                      סכום מחושב: ₪{editEquipmentTotal.toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-equipmentNotes">הערות</Label>
                  <Textarea
                    id="edit-equipmentNotes"
                    name="equipmentNotes"
                    defaultValue={payment.equipmentNotes ?? ""}
                  />
                </div>
                <input
                  type="hidden"
                  name="equipmentItems"
                  value={editEquipmentItemsJson}
                />
              </div>
            </div>
          )}

          {payment.paymentType === "EXAM" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edit-examCode">סוג מבחן *</Label>
                <select
                  id="edit-examCode"
                  name="examCode"
                  value={editExamCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setEditExamCode(code);
                    setEditExamAmount(code ? getExamAmount(code).toFixed(2) : "");
                  }}
                  required
                  className={formNativeSelectClassName()}
                >
                  <option value="">בחר סוג</option>
                  {exams.map((e) => (
                    <option key={e.id} value={e.code}>
                      {e.code} - {e.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-examDate">תאריך מבחן *</Label>
                <Input
                  id="edit-examDate"
                  name="examDate"
                  type="date"
                  required
                  defaultValue={payment.examDateIso ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-examAmount">סכום *</Label>
                <Input
                  id="edit-examAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editExamAmount}
                  onChange={(e) => setEditExamAmount(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          </fieldset>

          <RecordDialogSaveTailBanners phase={saveBannerPhase} />
          {updateState?.error && (
            <p className="text-sm text-destructive" role="alert">
              {updateState.error}
            </p>
          )}

          <div className="flex justify-start gap-2 pt-2">
            <Button
              type="submit"
              className="bg-dojo-red hover:bg-dojo-red/90"
              disabled={editFormLocked}
            >
              {updatePending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מעדכן...
                </>
              ) : (
                "עדכון"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={editFormLocked}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { createSportsEquipment } from "@/server/actions/create-sports-equipment";
import { updateSportsEquipment } from "@/server/actions/update-sports-equipment";
import { createExam } from "@/server/actions/create-exam";
import { updateExam } from "@/server/actions/update-exam";
import {
  RECORD_DIALOG_AUTOCLOSE_MS,
  RecordDialogBodyLock,
  RecordDialogCancelButton,
  RecordDialogPrimarySubmitButton,
  RecordDialogSaveTailBanners,
  recordDialogBlockDismiss,
  useRecordDialogPostSavePhase,
  useWrappedFormState,
} from "@/components/record-dialog/record-dialog-save-ux";

type SystemDataRow = {
  id: string;
  code: string;
  description: string;
  amount: number;
};

type Props = {
  sportsEquipment: SystemDataRow[];
  exams: SystemDataRow[];
};

export function SystemDataPageClient({
  sportsEquipment,
  exams,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sportsAddOpen, setSportsAddOpen] = useState(false);
  const [examAddOpen, setExamAddOpen] = useState(false);
  const sportsSuccessHandledRef = useRef(false);
  const examSuccessHandledRef = useRef(false);
  const {
    state: sportsState,
    formAction: sportsFormAction,
    submitBusy: sportsSubmitBusy,
  } = useWrappedFormState(createSportsEquipment, null);
  const {
    state: examState,
    formAction: examFormAction,
    submitBusy: examSubmitBusy,
  } = useWrappedFormState(createExam, null);
  const { tailPhase: sportsPhase } = useRecordDialogPostSavePhase({
    success: sportsState?.success,
    isOpen: sportsAddOpen,
    handledRef: sportsSuccessHandledRef,
    onAutoClose: () => setSportsAddOpen(false),
  });
  const { tailPhase: examPhase } = useRecordDialogPostSavePhase({
    success: examState?.success,
    isOpen: examAddOpen,
    handledRef: examSuccessHandledRef,
    onAutoClose: () => setExamAddOpen(false),
  });

  const [editSports, setEditSports] = useState<SystemDataRow | null>(null);
  const [editExam, setEditExam] = useState<SystemDataRow | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPhase, setEditPhase] = useState<"idle" | "refreshing" | "success">("idle");

  const handleEditSports = (row: SystemDataRow) => {
    setEditSports(row);
    setEditExam(null);
    setEditDescription(row.description);
    setEditAmount(String(row.amount));
    setEditError(null);
  };

  const handleEditExam = (row: SystemDataRow) => {
    setEditExam(row);
    setEditSports(null);
    setEditDescription(row.description);
    setEditAmount(String(row.amount));
    setEditError(null);
  };

  useEffect(() => {
    if (editPhase === "refreshing" && !isPending) setEditPhase("success");
  }, [editPhase, isPending]);

  useEffect(() => {
    if (editPhase === "success") {
      const t = setTimeout(() => {
        setEditSports(null);
        setEditExam(null);
        setEditPhase("idle");
      }, RECORD_DIALOG_AUTOCLOSE_MS);
      return () => clearTimeout(t);
    }
  }, [editPhase]);

  const handleEditSave = async () => {
    if (editSports) {
      setEditPending(true);
      setEditError(null);
      const result = await updateSportsEquipment(editSports.id, editDescription, editAmount);
      setEditPending(false);
      if (result.success) {
        setEditPhase("refreshing");
        startTransition(() => router.refresh());
      } else {
        setEditError(result.error ?? "שגיאה בשמירה");
      }
    } else if (editExam) {
      setEditPending(true);
      setEditError(null);
      const result = await updateExam(editExam.id, editDescription, editAmount);
      setEditPending(false);
      if (result.success) {
        setEditPhase("refreshing");
        startTransition(() => router.refresh());
      } else {
        setEditError(result.error ?? "שגיאה בשמירה");
      }
    }
  };

  const handleEditClose = () => {
    if (editPhase === "refreshing") return;
    setEditSports(null);
    setEditExam(null);
    setEditError(null);
    setEditPhase("idle");
  };

  return (
    <div className="space-y-8">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">ציוד ספורט</CardTitle>
          <Dialog
            open={sportsAddOpen}
            onOpenChange={(open) => {
              if (!open && recordDialogBlockDismiss(sportsPhase, sportsSubmitBusy))
                return;
              setSportsAddOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-dojo-red hover:bg-dojo-red/90">
                <Plus className="ml-1 h-4 w-4" />
                הוספה
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  הוספת ציוד ספורט
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  הקוד יווצר אוטומטית. הזן תיאור בלבד.
                </DialogDescription>
              </DialogHeader>
              <form action={sportsFormAction} className="grid gap-4 py-4">
                <RecordDialogBodyLock tailPhase={sportsPhase}>
                  <div className="grid gap-2">
                    <Label htmlFor="sports-description">תיאור</Label>
                    <Input
                      id="sports-description"
                      name="description"
                      placeholder="תיאור הפריט"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sports-amount">סכום ברירת מחדל (₪)</Label>
                    <Input
                      id="sports-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      required
                    />
                  </div>
                </RecordDialogBodyLock>
                <RecordDialogSaveTailBanners phase={sportsPhase} />
                {sportsState?.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {sportsState.error}
                  </p>
                )}
                <div className="flex justify-start gap-2">
                  {sportsPhase === "idle" && (
                    <>
                      <RecordDialogPrimarySubmitButton />
                      <RecordDialogCancelButton
                        onClick={() => setSportsAddOpen(false)}
                      />
                    </>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right text-muted-foreground">
                  קוד
                </TableHead>
                <TableHead className="text-right text-muted-foreground">
                  תיאור
                </TableHead>
                <TableHead className="text-right text-muted-foreground">
                  סכום
                </TableHead>
                <TableHead className="text-right text-muted-foreground w-[100px]">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sportsEquipment.length === 0 ? (
                <TableRow className="border-border/50">
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    אין פריטים. הוסף פריט ראשון.
                  </TableCell>
                </TableRow>
              ) : (
                sportsEquipment.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-border/50 hover:bg-muted/40"
                  >
                    <TableCell className="font-medium text-foreground font-mono">
                      {row.code}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {row.description}
                    </TableCell>
                    <TableCell className="text-foreground">
                      ₪{row.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditSports(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground">מבחנים</CardTitle>
          <Dialog
            open={examAddOpen}
            onOpenChange={(open) => {
              if (!open && recordDialogBlockDismiss(examPhase, examSubmitBusy)) return;
              setExamAddOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-dojo-red hover:bg-dojo-red/90">
                <Plus className="ml-1 h-4 w-4" />
                הוספה
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  הוספת מבחן
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  הקוד יווצר אוטומטית. הזן תיאור בלבד.
                </DialogDescription>
              </DialogHeader>
              <form action={examFormAction} className="grid gap-4 py-4">
                <RecordDialogBodyLock tailPhase={examPhase}>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-description">תיאור</Label>
                    <Input
                      id="exam-description"
                      name="description"
                      placeholder="תיאור המבחן"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="exam-amount">סכום ברירת מחדל (₪)</Label>
                    <Input
                      id="exam-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      required
                    />
                  </div>
                </RecordDialogBodyLock>
                <RecordDialogSaveTailBanners phase={examPhase} />
                {examState?.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {examState.error}
                  </p>
                )}
                <div className="flex justify-start gap-2">
                  {examPhase === "idle" && (
                    <>
                      <RecordDialogPrimarySubmitButton />
                      <RecordDialogCancelButton
                        onClick={() => setExamAddOpen(false)}
                      />
                    </>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-right text-muted-foreground">
                  קוד
                </TableHead>
                <TableHead className="text-right text-muted-foreground">
                  תיאור
                </TableHead>
                <TableHead className="text-right text-muted-foreground">
                  סכום
                </TableHead>
                <TableHead className="text-right text-muted-foreground w-[100px]">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow className="border-border/50">
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    אין פריטים. הוסף פריט ראשון.
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-border/50 hover:bg-muted/40"
                  >
                    <TableCell className="font-medium text-foreground font-mono">
                      {row.code}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {row.description}
                    </TableCell>
                    <TableCell className="text-foreground">
                      ₪{row.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditExam(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!editSports || !!editExam}
        onOpenChange={(open) => {
          if (!open && editPhase === "refreshing") return;
          if (!open) handleEditClose();
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              עריכת {editSports ? "ציוד ספורט" : "מבחן"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              הקוד אינו ניתן לעריכה. ניתן לערוך תיאור וסכום.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <RecordDialogSaveTailBanners phase={editPhase} />
            {editPhase === "idle" && (
              <>
                <fieldset
                  disabled={editPending}
                  className="min-w-0 border-0 p-0 disabled:pointer-events-none disabled:opacity-60"
                >
                  <div className="grid gap-2">
                    <Label>קוד</Label>
                    <Input
                      value={editSports?.code ?? editExam?.code ?? ""}
                      readOnly
                      disabled
                      className="font-mono text-muted-foreground opacity-90"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">תיאור</Label>
                    <Input
                      id="edit-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="תיאור"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-amount">סכום ברירת מחדל (₪)</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                    />
                  </div>
                </fieldset>
                {editError && (
                  <p className="text-sm text-destructive" role="alert">
                    {editError}
                  </p>
                )}
                <div className="flex justify-start gap-2">
                  <Button
                    onClick={handleEditSave}
                    disabled={editPending}
                    className="bg-dojo-red hover:bg-dojo-red/90"
                  >
                    {editPending ? (
                      <>
                        <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      "שמירה"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleEditClose}
                    disabled={editPending}
                  >
                    ביטול
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

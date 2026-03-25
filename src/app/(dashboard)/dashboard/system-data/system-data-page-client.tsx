"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
import { Plus, Pencil, Loader2, CheckCircle } from "lucide-react";
import { createSportsEquipment } from "@/server/actions/create-sports-equipment";
import { updateSportsEquipment } from "@/server/actions/update-sports-equipment";
import { createExam } from "@/server/actions/create-exam";
import { updateExam } from "@/server/actions/update-exam";

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

function CreateSportsEquipmentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="bg-dojo-red hover:bg-dojo-red/90"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          שומר...
        </>
      ) : (
        "שמירה"
      )}
    </Button>
  );
}

function CreateExamSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="bg-dojo-red hover:bg-dojo-red/90"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          שומר...
        </>
      ) : (
        "שמירה"
      )}
    </Button>
  );
}

export function SystemDataPageClient({
  sportsEquipment,
  exams,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sportsAddOpen, setSportsAddOpen] = useState(false);
  const [examAddOpen, setExamAddOpen] = useState(false);
  const [sportsState, sportsFormAction] = useFormState(
    createSportsEquipment,
    null
  );
  const [examState, examFormAction] = useFormState(createExam, null);
  const sportsSuccessHandledRef = useRef(false);
  const examSuccessHandledRef = useRef(false);
  const [sportsPhase, setSportsPhase] = useState<"idle" | "refreshing" | "success">("idle");
  const [examPhase, setExamPhase] = useState<"idle" | "refreshing" | "success">("idle");

  const [editSports, setEditSports] = useState<SystemDataRow | null>(null);
  const [editExam, setEditExam] = useState<SystemDataRow | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editPhase, setEditPhase] = useState<"idle" | "refreshing" | "success">("idle");

  useEffect(() => {
    if (sportsState?.success && sportsAddOpen && !sportsSuccessHandledRef.current) {
      sportsSuccessHandledRef.current = true;
      setSportsPhase("refreshing");
      startTransition(() => router.refresh());
    }
  }, [sportsState?.success, sportsAddOpen, router]);

  useEffect(() => {
    if (sportsPhase === "refreshing" && !isPending) setSportsPhase("success");
  }, [sportsPhase, isPending]);

  useEffect(() => {
    if (sportsPhase === "success") {
      const t = setTimeout(() => {
        setSportsAddOpen(false);
        setSportsPhase("idle");
        sportsSuccessHandledRef.current = false;
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [sportsPhase]);

  useEffect(() => {
    if (examState?.success && examAddOpen && !examSuccessHandledRef.current) {
      examSuccessHandledRef.current = true;
      setExamPhase("refreshing");
      startTransition(() => router.refresh());
    }
  }, [examState?.success, examAddOpen, router]);

  useEffect(() => {
    if (examPhase === "refreshing" && !isPending) setExamPhase("success");
  }, [examPhase, isPending]);

  useEffect(() => {
    if (examPhase === "success") {
      const t = setTimeout(() => {
        setExamAddOpen(false);
        setExamPhase("idle");
        examSuccessHandledRef.current = false;
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [examPhase]);

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
      }, 1200);
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
      <Card className="border-white/10 bg-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">ציוד ספורט</CardTitle>
          <Dialog
            open={sportsAddOpen}
            onOpenChange={(open) => {
              if (!open && sportsPhase === "refreshing") return;
              setSportsAddOpen(open);
              if (!open) {
                setSportsPhase("idle");
                sportsSuccessHandledRef.current = false;
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-dojo-red hover:bg-dojo-red/90">
                <Plus className="ml-1 h-4 w-4" />
                הוספה
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">
                  הוספת ציוד ספורט
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  הקוד יווצר אוטומטית. הזן תיאור בלבד.
                </DialogDescription>
              </DialogHeader>
              <form action={sportsFormAction} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="sports-description">תיאור</Label>
                  <Input
                    id="sports-description"
                    name="description"
                    placeholder="תיאור הפריט"
                    required
                    className="bg-zinc-800 border-white/10 text-white"
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
                    className="bg-zinc-800 border-white/10 text-white"
                  />
                </div>
                {sportsPhase === "refreshing" && (
                  <div
                    className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 dark:text-blue-400"
                    role="status"
                  >
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    מעדכן נתונים...
                  </div>
                )}
                {sportsPhase === "success" && (
                  <div
                    className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
                    role="status"
                  >
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    הרשומה נשמרה בהצלחה
                  </div>
                )}
                {sportsState?.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {sportsState.error}
                  </p>
                )}
                <div className="flex justify-start gap-2">
                  {sportsPhase === "idle" && (
                    <>
                      <CreateSportsEquipmentSubmitButton />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSportsAddOpen(false)}
                      >
                        ביטול
                      </Button>
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
              <TableRow className="border-white/10 hover:bg-transparent">
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
                <TableRow className="border-white/5">
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
                    className="border-white/5 hover:bg-white/[0.04]"
                  >
                    <TableCell className="font-medium text-white font-mono">
                      {row.code}
                    </TableCell>
                    <TableCell className="text-white">
                      {row.description}
                    </TableCell>
                    <TableCell className="text-white">
                      ₪{row.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-white"
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

      <Card className="border-white/10 bg-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">מבחנים</CardTitle>
          <Dialog
            open={examAddOpen}
            onOpenChange={(open) => {
              if (!open && examPhase === "refreshing") return;
              setExamAddOpen(open);
              if (!open) {
                setExamPhase("idle");
                examSuccessHandledRef.current = false;
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="bg-dojo-red hover:bg-dojo-red/90">
                <Plus className="ml-1 h-4 w-4" />
                הוספה
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">
                  הוספת מבחן
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  הקוד יווצר אוטומטית. הזן תיאור בלבד.
                </DialogDescription>
              </DialogHeader>
              <form action={examFormAction} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="exam-description">תיאור</Label>
                  <Input
                    id="exam-description"
                    name="description"
                    placeholder="תיאור המבחן"
                    required
                    className="bg-zinc-800 border-white/10 text-white"
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
                    className="bg-zinc-800 border-white/10 text-white"
                  />
                </div>
                {examPhase === "refreshing" && (
                  <div
                    className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 dark:text-blue-400"
                    role="status"
                  >
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    מעדכן נתונים...
                  </div>
                )}
                {examPhase === "success" && (
                  <div
                    className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
                    role="status"
                  >
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    הרשומה נשמרה בהצלחה
                  </div>
                )}
                {examState?.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {examState.error}
                  </p>
                )}
                <div className="flex justify-start gap-2">
                  {examPhase === "idle" && (
                    <>
                      <CreateExamSubmitButton />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExamAddOpen(false)}
                      >
                        ביטול
                      </Button>
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
              <TableRow className="border-white/10 hover:bg-transparent">
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
                <TableRow className="border-white/5">
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
                    className="border-white/5 hover:bg-white/[0.04]"
                  >
                    <TableCell className="font-medium text-white font-mono">
                      {row.code}
                    </TableCell>
                    <TableCell className="text-white">
                      {row.description}
                    </TableCell>
                    <TableCell className="text-white">
                      ₪{row.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-white"
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
        <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              עריכת {editSports ? "ציוד ספורט" : "מבחן"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editPhase === "refreshing"
                ? "מעדכן נתונים..."
                : editPhase === "success"
                  ? "הרשומה נשמרה בהצלחה"
                  : "הקוד אינו ניתן לעריכה. ניתן לערוך תיאור וסכום."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {editPhase === "refreshing" ? (
              <div
                className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 dark:text-blue-400"
                role="status"
              >
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                מעדכן נתונים...
              </div>
            ) : editPhase === "success" ? (
              <div className="flex flex-col gap-4">
                <div
                  className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
                  role="status"
                >
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  הרשומה נשמרה בהצלחה
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleEditClose}>
                    סגור
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>קוד</Label>
                  <Input
                    value={editSports?.code ?? editExam?.code ?? ""}
                    readOnly
                    disabled
                    className="bg-zinc-800 border-white/10 text-muted-foreground font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">תיאור</Label>
                  <Input
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="תיאור"
                    className="bg-zinc-800 border-white/10 text-white"
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
                    className="bg-zinc-800 border-white/10 text-white"
                  />
                </div>
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
                  <Button variant="outline" onClick={handleEditClose}>
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

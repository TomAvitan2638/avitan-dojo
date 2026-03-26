"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Building2,
  User,
  Banknote,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { createCenter } from "@/server/actions/create-center";
import { deleteCenter } from "@/server/actions/delete-center";
import {
  createRecordDialogClassName,
  formNativeSelectClassName,
} from "@/lib/form-field";

type CenterRow = {
  id: string;
  name: string;
  instructorName: string | null;
  price: number | null;
  notes: string | null;
  groupsCount: number;
};

type InstructorOption = {
  id: string;
  name: string;
};

type Props = {
  centers: CenterRow[];
  instructors: InstructorOption[];
};

function CreateCenterSubmitButton() {
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

export function CentersPageClient({ centers, instructors }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [state, formAction] = useFormState(createCenter, null);
  const createSuccessHandledRef = useRef(false);
  const [createPhase, setCreatePhase] = useState<"idle" | "refreshing" | "success">("idle");
  const [deleteDialogCenter, setDeleteDialogCenter] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteState, setDeleteState] = useState<{
    pending?: boolean;
    error?: string;
  }>({});
  const [deletePhase, setDeletePhase] = useState<"idle" | "refreshing" | "success">("idle");

  useEffect(() => {
    if (state?.success && isAddDialogOpen && !createSuccessHandledRef.current) {
      createSuccessHandledRef.current = true;
      setCreatePhase("refreshing");
      startTransition(() => router.refresh());
    }
  }, [state?.success, isAddDialogOpen, router]);

  useEffect(() => {
    if (createPhase === "refreshing" && !isPending) setCreatePhase("success");
  }, [createPhase, isPending]);

  useEffect(() => {
    if (createPhase === "success") {
      const t = setTimeout(() => {
        setIsAddDialogOpen(false);
        setCreatePhase("idle");
        createSuccessHandledRef.current = false;
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [createPhase]);

  useEffect(() => {
    if (deletePhase === "refreshing" && !isPending) setDeletePhase("success");
  }, [deletePhase, isPending]);

  useEffect(() => {
    if (deletePhase === "success") {
      const t = setTimeout(() => {
        setDeleteDialogCenter(null);
        setDeletePhase("idle");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [deletePhase]);

  const handleDeleteConfirm = async () => {
    if (!deleteDialogCenter) return;
    setDeleteState({ pending: true, error: undefined });
    const result = await deleteCenter(deleteDialogCenter.id);
    setDeleteState((prev) => ({ ...prev, pending: false }));
    if (result.success) {
      setDeletePhase("refreshing");
      startTransition(() => router.refresh());
    } else {
      setDeleteState((prev) => ({ ...prev, error: result.error }));
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && deletePhase === "refreshing") return;
    if (!open) {
      setDeleteDialogCenter(null);
      setDeleteState({});
      setDeletePhase("idle");
    }
  };

  const filteredCenters = centers.filter(
    (center) =>
      center.name.includes(searchQuery) ||
      (center.instructorName?.includes(searchQuery) ?? false) ||
      (center.notes?.includes(searchQuery) ?? false)
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש מרכז..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary pr-10"
          />
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            if (!open && createPhase === "refreshing") return;
            setIsAddDialogOpen(open);
            if (!open) {
              setCreatePhase("idle");
              createSuccessHandledRef.current = false;
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-dojo-red hover:bg-dojo-red/90">
              <Plus className="ml-2 h-4 w-4" />
              הוספת מרכז
            </Button>
          </DialogTrigger>
          <DialogContent className={createRecordDialogClassName("md")}>
            <div className="shrink-0 border-b border-border/70 px-6 pb-4 pt-6">
              <DialogHeader>
                <DialogTitle>הוספת מרכז חדש</DialogTitle>
                <DialogDescription>הזן את פרטי המרכז החדש</DialogDescription>
              </DialogHeader>
            </div>
            <form
              action={formAction}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">שם המרכז</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="הזן שם מרכז"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructorId">מאמן אחראי</Label>
                    <select
                      id="instructorId"
                      name="instructorId"
                      className={formNativeSelectClassName()}
                    >
                      <option value="">ללא מאמן</option>
                      {instructors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">מחיר חודשי</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="₪000"
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">הערות</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="הערות נוספות"
                    />
                  </div>
                </div>
              </div>
              <div className="shrink-0 space-y-3 border-t border-border/70 bg-background px-6 py-4">
                {createPhase === "refreshing" && (
                  <div
                    className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-600 dark:text-blue-400"
                    role="status"
                  >
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                    מעדכן נתונים...
                  </div>
                )}
                {createPhase === "success" && (
                  <div
                    className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400"
                    role="status"
                  >
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    הרשומה נשמרה בהצלחה
                  </div>
                )}
                {state?.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {state.error}
                  </p>
                )}
                <div className="flex justify-start gap-2">
                  {createPhase === "idle" && (
                    <>
                      <CreateCenterSubmitButton />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        ביטול
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filteredCenters.length === 0 ? (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              אין מרכזים להצגה
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              נסה לשנות את החיפוש או הוסף מרכז חדש
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCenters.map((center) => (
            <Card key={center.id} className="border-border/50 bg-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-dojo-red/10 p-3">
                      <Building2 className="h-6 w-6 text-dojo-red" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {center.name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        {center.instructorName && (
                          <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {center.instructorName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/centers/${center.id}`}
                        className="flex items-center"
                      >
                        <Eye className="ml-1 h-4 w-4" />
                        צפייה
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/centers/${center.id}/edit`}
                        className="flex items-center"
                      >
                        <Pencil className="ml-1 h-4 w-4" />
                        עריכה
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        setDeleteDialogCenter({ id: center.id, name: center.name })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-dojo-gold" />
                    <span className="font-bold text-dojo-gold">
                      {center.price != null ? `₪${center.price}` : "-"}
                    </span>
                    <span className="text-xs text-muted-foreground">/ חודש</span>
                  </div>
                  <Badge variant="outline" className="border-border">
                    {center.groupsCount} קבוצות
                  </Badge>
                </div>

                {center.notes && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {center.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!deleteDialogCenter}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>מחיקת מרכז</DialogTitle>
            <DialogDescription>
              {deletePhase === "refreshing"
                ? "מעדכן נתונים..."
                : deletePhase === "success"
                  ? "הרשומה נמחקה בהצלחה"
                  : deleteDialogCenter
                    ? `האם אתה בטוח שברצונך למחוק את המרכז ${deleteDialogCenter.name}? פעולה זו אינה ניתנת לביטול.`
                    : ""}
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
                  size="sm"
                  onClick={() => handleDeleteDialogOpenChange(false)}
                >
                  סגור
                </Button>
              </div>
            </div>
          ) : (
            <>
              {deleteState.error && (
                <p className="text-sm text-destructive" role="alert">
                  {deleteState.error}
                </p>
              )}
              <div className="flex justify-start gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={deleteState.pending}
                >
                  {deleteState.pending ? (
                    <>
                      <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                      מוחק...
                    </>
                  ) : (
                    "מחיקה"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteDialogOpenChange(false)}
                  disabled={deleteState.pending}
                >
                  ביטול
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

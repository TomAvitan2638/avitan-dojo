"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Users,
  MapPin,
  Calendar,
  Clock,
  Layers,
  Loader2,
  Trash2,
  CheckCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import {
  createRecordDialogClassName,
  formNativeSelectClassName,
  formNativeSelectCompactClassName,
} from "@/lib/form-field";
import { createGroup } from "@/server/actions/create-group";
import { deleteGroup } from "@/server/actions/delete-group";
import { TRAINING_DAYS_ORDER, TRAINING_DAY_LABELS } from "@/lib/training-days";
import type { TrainingDay } from "@prisma/client";

type ScheduleSlot = {
  trainingDay: TrainingDay;
  startTime: string;
  endTime: string;
};

type GroupRow = {
  id: string;
  name: string;
  centerName: string;
  instructorName: string;
  notes: string | null;
  studentsCount: number;
  boysCount: number;
  girlsCount: number;
  scheduleSummary: { day: string; time: string }[];
};

type CenterOption = { id: string; name: string };
type InstructorOption = { id: string; name: string };

type Props = {
  groups: GroupRow[];
  centers: CenterOption[];
  instructors: InstructorOption[];
};

function CreateGroupSubmitButton() {
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

export function GroupsPageClient({
  groups,
  centers,
  instructors,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [state, formAction] = useFormState(createGroup, null);
  const createSuccessHandledRef = useRef(false);
  const [createPhase, setCreatePhase] = useState<"idle" | "refreshing" | "success">("idle");
  const [deleteDialogGroup, setDeleteDialogGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteState, setDeleteState] = useState<{
    pending?: boolean;
    error?: string;
  }>({});
  const [deletePhase, setDeletePhase] = useState<"idle" | "refreshing" | "success">("idle");
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([
    { trainingDay: "SUNDAY", startTime: "16:00", endTime: "17:00" },
  ]);

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
        setSchedules([{ trainingDay: "SUNDAY", startTime: "16:00", endTime: "17:00" }]);
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
        setDeleteDialogGroup(null);
        setDeletePhase("idle");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [deletePhase]);

  const handleDeleteConfirm = async () => {
    if (!deleteDialogGroup) return;
    setDeleteState({ pending: true, error: undefined });
    const result = await deleteGroup(deleteDialogGroup.id);
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
      setDeleteDialogGroup(null);
      setDeleteState({});
      setDeletePhase("idle");
    }
  };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.includes(searchQuery) ||
      g.centerName.includes(searchQuery) ||
      g.instructorName.includes(searchQuery) ||
      (g.notes?.includes(searchQuery) ?? false)
  );

  const addSchedule = () => {
    setSchedules((prev) => [
      ...prev,
      { trainingDay: "SUNDAY", startTime: "16:00", endTime: "17:00" },
    ]);
  };

  const removeSchedule = (idx: number) => {
    setSchedules((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSchedule = (idx: number, field: keyof ScheduleSlot, value: string) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש קבוצה..."
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
              הוספת קבוצה
            </Button>
          </DialogTrigger>
          <DialogContent className={createRecordDialogClassName("lg")}>
            <div className="shrink-0 border-b border-border/70 px-6 pb-4 pt-6">
              <DialogHeader>
                <DialogTitle>הוספת קבוצה חדשה</DialogTitle>
                <DialogDescription>הזן את פרטי הקבוצה החדשה</DialogDescription>
              </DialogHeader>
            </div>
            <form
              action={formAction}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
                <div className="grid gap-4">
                  <input
                    type="hidden"
                    name="schedules"
                    value={JSON.stringify(schedules)}
                  />
                  <div className="grid gap-2">
                    <Label htmlFor="name">שם הקבוצה</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="הזן שם קבוצה"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="centerId">מרכז</Label>
                    <select
                      id="centerId"
                      name="centerId"
                      required
                      className={formNativeSelectClassName()}
                    >
                      <option value="">בחר מרכז</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instructorId">מאמן</Label>
                    <select
                      id="instructorId"
                      name="instructorId"
                      required
                      className={formNativeSelectClassName()}
                    >
                      <option value="">בחר מאמן</option>
                      {instructors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label>לוח זמנים</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSchedule}
                      >
                        <Plus className="ml-1 h-3 w-3" />
                        הוסף
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {schedules.map((s, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-input/80 bg-popover/30 p-2"
                        >
                          <select
                            value={s.trainingDay}
                            onChange={(e) =>
                              updateSchedule(idx, "trainingDay", e.target.value)
                            }
                            className={formNativeSelectCompactClassName()}
                          >
                            {TRAINING_DAYS_ORDER.map((d) => (
                              <option key={d} value={d}>
                                {TRAINING_DAY_LABELS[d]}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="time"
                            value={s.startTime}
                            onChange={(e) =>
                              updateSchedule(idx, "startTime", e.target.value)
                            }
                            className="h-8 w-24"
                            dir="ltr"
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            type="time"
                            value={s.endTime}
                            onChange={(e) =>
                              updateSchedule(idx, "endTime", e.target.value)
                            }
                            className="h-8 w-24"
                            dir="ltr"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeSchedule(idx)}
                            disabled={schedules.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
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
                      <CreateGroupSubmitButton />
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

      {filteredGroups.length === 0 ? (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              אין קבוצות להצגה
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              נסה לשנות את החיפוש או הוסף קבוצה חדשה
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map((group) => (
            <Card key={group.id} className="flex h-full flex-col border-border/50 bg-card overflow-hidden">
              <CardHeader className="shrink-0 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{group.name}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {group.instructorName}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-default">
                        <Badge className="border-dojo-red/20 bg-dojo-red/10 text-dojo-red">
                          <Users className="ml-1 h-3 w-3" />
                          {group.studentsCount}
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-right" sideOffset={8}>
                      <div className="space-y-1">
                        <p>סה״כ תלמידים: {group.studentsCount}</p>
                        <p>בנים: {group.boysCount}</p>
                        <p>בנות: {group.girlsCount}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col min-h-0 pb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{group.centerName}</span>
                  </div>
                  {group.scheduleSummary.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        לוח זמנים
                      </p>
                      <div className="space-y-1">
                        {group.scheduleSummary.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{slot.day}</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {slot.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {group.notes && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                      {group.notes}
                    </p>
                  )}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/groups/${group.id}`}>
                      <Eye className="ml-1 h-4 w-4" />
                      צפייה
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/groups/${group.id}/edit`}>
                      <Pencil className="ml-1 h-4 w-4" />
                      עריכה
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setDeleteDialogGroup({ id: group.id, name: group.name })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!deleteDialogGroup}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>מחיקת קבוצה</DialogTitle>
            <DialogDescription>
              {deletePhase === "refreshing"
                ? "מעדכן נתונים..."
                : deletePhase === "success"
                  ? "הרשומה נמחקה בהצלחה"
                  : deleteDialogGroup
                    ? `האם אתה בטוח שברצונך למחוק את הקבוצה ${deleteDialogGroup.name}? פעולה זו אינה ניתנת לביטול.`
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

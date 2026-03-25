"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Users,
  Eye,
  Pencil,
  Trash2,
  UserCog,
  Loader2,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { createInstructor } from "@/server/actions/create-instructor";
import { deleteInstructor } from "@/server/actions/delete-instructor";
import { InstructorImageUpload } from "@/components/instructors/instructor-image-upload";

type InstructorRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  photoUrl: string | null;
  isActive: boolean;
  groupsCount: number;
};

type Props = {
  instructors: InstructorRow[];
};

function CreateInstructorSubmitButton() {
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

export function InstructorsPageClient({ instructors }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [state, formAction] = useFormState(createInstructor, null);
  const createSuccessHandledRef = useRef(false);
  const [createPhase, setCreatePhase] = useState<"idle" | "refreshing" | "success">("idle");
  const [deleteDialogInstructor, setDeleteDialogInstructor] = useState<{
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
        setDeleteDialogInstructor(null);
        setDeletePhase("idle");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [deletePhase]);

  const handleDeleteConfirm = async () => {
    if (!deleteDialogInstructor) return;
    setDeleteState({ pending: true, error: undefined });
    const result = await deleteInstructor(deleteDialogInstructor.id);
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
      setDeleteDialogInstructor(null);
      setDeleteState({});
      setDeletePhase("idle");
    }
  };

  const filteredInstructors = instructors.filter(
    (instructor) =>
      instructor.name.includes(searchQuery) ||
      instructor.city.includes(searchQuery) ||
      instructor.email.includes(searchQuery)
  );

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש מאמן..."
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
              הוספת מאמן
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>הוספת מאמן חדש</DialogTitle>
              <DialogDescription>הזן את פרטי המאמן החדש</DialogDescription>
            </DialogHeader>
            <form
              action={formAction}
              className="grid gap-4 py-4"
              encType="multipart/form-data"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">שם פרטי</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="שם פרטי"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">שם משפחה</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="שם משפחה"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="050-0000000"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">עיר</Label>
                <Input id="city" name="city" placeholder="הזן עיר" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">כתובת</Label>
                <Input id="address" name="address" placeholder="הזן כתובת" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="birthDate">תאריך לידה</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">הערות</Label>
                <Input id="notes" name="notes" placeholder="הערות" />
              </div>
              <InstructorImageUpload />
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
                    <CreateInstructorSubmitButton />
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
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {filteredInstructors.length === 0 ? (
        <Card className="border-border/50 bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserCog className="h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              אין מאמנים להצגה
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              נסה לשנות את החיפוש או הוסף מאמן חדש
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredInstructors.map((instructor) => (
            <Card
              key={instructor.id}
              className="border-border/50 bg-card overflow-hidden group"
            >
              <CardContent className="p-0">
                <div className="relative p-6">
                  <div className="flex justify-center">
                    <Avatar className="h-24 w-24 border-4 border-dojo-red/20">
                      {instructor.photoUrl ? (
                        <AvatarImage
                          src={instructor.photoUrl}
                          alt={instructor.name}
                          className="object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-dojo-red/10 text-2xl text-dojo-red">
                          {instructor.name.split(" ").slice(-1)[0]?.charAt(0) ??
                            "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>

                  <div className="mt-4 text-center">
                    <h3 className="text-lg font-bold text-foreground">
                      {instructor.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        instructor.isActive
                          ? "mt-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                          : "mt-2 border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
                      }
                    >
                      {instructor.isActive ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span dir="ltr" className="truncate">
                        {instructor.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span
                        dir="ltr"
                        className="truncate"
                        title={instructor.email}
                      >
                        {instructor.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{instructor.city}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>{instructor.groupsCount} קבוצות</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={`/dashboard/instructors/${instructor.id}`}
                        className="flex items-center justify-center"
                      >
                        <Eye className="ml-1 h-4 w-4" />
                        צפייה
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link
                        href={`/dashboard/instructors/${instructor.id}/edit`}
                        className="flex items-center justify-center"
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
                        setDeleteDialogInstructor({
                          id: instructor.id,
                          name: instructor.name,
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!deleteDialogInstructor}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>מחיקת מאמן</DialogTitle>
            <DialogDescription>
              {deletePhase === "refreshing"
                ? "מעדכן נתונים..."
                : deletePhase === "success"
                  ? "הרשומה נמחקה בהצלחה"
                  : deleteDialogInstructor
                    ? `האם אתה בטוח שברצונך למחוק את המאמן ${deleteDialogInstructor.name}? פעולה זו אינה ניתנת לביטול.`
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

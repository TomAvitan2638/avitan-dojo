"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Plus, Search, Users, User } from "lucide-react";
import { createStudent } from "@/server/actions/create-student";
import { getStudentForModal } from "@/server/actions/get-student-for-modal";
import { StudentImageUpload } from "@/components/students/student-image-upload";
import { formNativeSelectClassName } from "@/lib/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  StudentDetailsModal,
  type StudentForModal,
} from "@/components/students/student-details-modal";
import {
  filterStudentListRows,
  type StudentListRow,
} from "@/lib/student-list-filter";
import {
  RecordDialogBodyLock,
  RecordDialogCancelButton,
  RecordDialogPrimarySubmitButton,
  RecordDialogSaveTailBanners,
  recordDialogBlockDismiss,
  useRecordDialogPostSavePhase,
  useWrappedFormState,
} from "@/components/record-dialog/record-dialog-save-ux";
import { useStudentsPageQuery } from "@/hooks/use-students-page-query";
import type { StudentsPageQueryScope } from "@/types/students-page";
import { invalidateStudentsPageQueries } from "@/lib/students-page-query";
import {
  ListLoadingBanner,
  StudentsListSkeletonDualSections,
} from "@/components/dashboard/dashboard-loading-skeleton";

type SortColumn =
  | "identifier"
  | "name"
  | "status"
  | "centerName"
  | "groupName"
  | "registrationDate"
  | "endDate";
type SortDirection = "asc" | "desc";

type Props = {
  queryScope: StudentsPageQueryScope;
};

function toTimestamp(d: Date | string | null | undefined): number {
  if (d == null) return 0;
  const date = typeof d === "string" ? new Date(d) : d;
  const ts = date.getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function StudentsListSkeleton() {
  return (
    <div
      className="mt-1 space-y-6"
      role="status"
      aria-busy="true"
      aria-label="טוען טבלת תלמידים"
    >
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-muted/50" />
        <Card className="overflow-hidden border-border/50 bg-card">
          <CardContent className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md bg-muted/30"
              />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-48 animate-pulse rounded bg-muted/50" />
        <Card className="overflow-hidden border-border/50 bg-card">
          <CardContent className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-md bg-muted/30"
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function StudentsPageClient({ queryScope }: Props) {
  const queryClient = useQueryClient();
  const {
    data,
    isError,
    error,
    refetch,
    isPending,
  } = useStudentsPageQuery({ scope: queryScope });

  const syncStudentsCache = useCallback(async () => {
    await invalidateStudentsPageQueries(queryClient);
  }, [queryClient]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const createSuccessHandledRef = useRef(false);
  const { state, formAction, submitBusy } = useWrappedFormState(createStudent, null);
  const { tailPhase: createPhase } = useRecordDialogPostSavePhase({
    success: state?.success,
    isOpen: isAddDialogOpen,
    handledRef: createSuccessHandledRef,
    onAutoClose: () => {
      setIsAddDialogOpen(false);
      setSelectedCenterId("");
    },
    syncOnSuccess: syncStudentsCache,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [modalStudent, setModalStudent] = useState<StudentForModal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalLoadError, setModalLoadError] = useState<string | null>(null);
  const [modalInitialEditMode, setModalInitialEditMode] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const loadingWithoutData = isPending && !data;

  const filteredStudents = useMemo(() => {
    if (!data) return [] as StudentListRow[];
    return filterStudentListRows(data.students, searchQuery);
  }, [data, searchQuery]);

  /** `Student.status === "active"` vs all other enum values — same badge logic as the table. */
  const activeStudents = useMemo(
    () => filteredStudents.filter((s) => s.status === "active"),
    [filteredStudents]
  );
  const inactiveStudents = useMemo(
    () => filteredStudents.filter((s) => s.status !== "active"),
    [filteredStudents]
  );

  const sortRows = useCallback(
    (rows: StudentListRow[]) => {
      return [...rows].sort((a, b) => {
        let cmp = 0;
        switch (sortColumn) {
          case "identifier": {
            const ai = a.identifier ?? "";
            const bi = b.identifier ?? "";
            const an = parseInt(ai, 10);
            const bn = parseInt(bi, 10);
            if (!Number.isNaN(an) && !Number.isNaN(bn)) {
              cmp = an - bn;
            } else {
              cmp = ai.localeCompare(bi);
            }
            break;
          }
          case "name":
            cmp = (a.name ?? "").localeCompare(b.name ?? "");
            break;
          case "status":
            cmp = (a.status ?? "").localeCompare(b.status ?? "");
            break;
          case "centerName":
            cmp = (a.centerName ?? "").localeCompare(b.centerName ?? "");
            break;
          case "groupName":
            cmp = (a.groupName ?? "").localeCompare(b.groupName ?? "");
            break;
          case "registrationDate":
            cmp = toTimestamp(a.registrationDateRaw) - toTimestamp(b.registrationDateRaw);
            break;
          case "endDate":
            cmp = toTimestamp(a.endDateRaw) - toTimestamp(b.endDateRaw);
            break;
          default:
            cmp = 0;
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    },
    [sortColumn, sortDirection]
  );

  const sortedActive = useMemo(() => sortRows(activeStudents), [activeStudents, sortRows]);
  const sortedInactive = useMemo(() => sortRows(inactiveStudents), [inactiveStudents, sortRows]);

  const filteredGroups = useMemo(() => {
    if (!data || !selectedCenterId) return [];
    return data.groups.filter((g) => g.centerId === selectedCenterId);
  }, [data, selectedCenterId]);

  useEffect(() => {
    if (isAddDialogOpen) setSelectedCenterId("");
  }, [isAddDialogOpen]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const openModalForStudent = async (studentId: string, openInEditMode = false) => {
    setModalInitialEditMode(openInEditMode);
    setModalOpen(true);
    setModalStudent(null);
    setModalLoadError(null);
    setModalLoading(true);
    const result = await getStudentForModal(studentId);
    setModalLoading(false);
    if (result.ok) {
      setModalStudent(result.student);
    } else {
      setModalLoadError(result.error);
    }
  };

  const handleModalOpenChange = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setModalStudent(null);
      setModalLoadError(null);
      setModalLoading(false);
    }
  };

  const handleModalSaveSuccess = async () => {
    if (modalStudent?.id) {
      const r = await getStudentForModal(modalStudent.id);
      if (r.ok) setModalStudent(r.student);
    }
  };

  const refreshModalStudent = useCallback(async () => {
    if (!modalStudent?.id) return;
    const r = await getStudentForModal(modalStudent.id);
    if (r.ok) setModalStudent(r.student);
    await invalidateStudentsPageQueries(queryClient);
  }, [modalStudent?.id, queryClient]);

  const cellClass =
    "py-3.5 px-4 text-[15px] align-middle text-right";
  const headerClass =
    "py-3.5 px-4 text-[15px] font-medium text-muted-foreground align-middle text-right";

  const SortHeader = ({
    column,
    label,
  }: {
    column: SortColumn;
    label: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/30 transition-colors duration-150 ${headerClass}`}
      onClick={() => handleSort(column)}
    >
      {label}
      {sortColumn === column ? (
        <span className="ms-1.5 text-muted-foreground/70 text-xs">
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      ) : null}
    </TableHead>
  );

  const renderTableRows = (rows: StudentListRow[]) =>
    rows.map((student) => (
      <TableRow
        key={student.id}
        className="cursor-pointer border-b border-border/50 transition-colors duration-150 hover:bg-muted/40"
        onClick={() => openModalForStudent(student.id)}
      >
        <TableCell
          className="w-[52px] min-w-[52px] max-w-[52px] py-3.5 px-2 text-right align-middle"
          title={student.name}
        >
          <div className="flex justify-center">
            <Avatar className="h-8 w-8 shrink-0">
              {student.photoUrl ? (
                <AvatarImage
                  src={student.photoUrl}
                  alt={student.name}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </TableCell>
        <TableCell
          dir="ltr"
          className={`min-w-[180px] font-medium tabular-nums whitespace-nowrap ${cellClass}`}
          title={student.identifier}
        >
          {student.identifier}
        </TableCell>
        <TableCell
          className={`max-w-[220px] truncate font-semibold ${cellClass}`}
          title={student.name}
        >
          {student.name}
        </TableCell>
        <TableCell
          className={`max-w-[100px] ${cellClass}`}
          title={student.status === "active" ? "פעיל" : "לא פעיל"}
        >
          {student.status === "active" ? (
            <Badge
              variant="secondary"
              className="border-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-normal"
            >
              פעיל
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="border-0 bg-muted/50 text-muted-foreground font-normal"
            >
              לא פעיל
            </Badge>
          )}
        </TableCell>
        <TableCell
          className={`max-w-[140px] truncate text-muted-foreground ${cellClass}`}
          title={student.centerName ?? "-"}
        >
          {student.centerName ?? "-"}
        </TableCell>
        <TableCell
          className={`max-w-[140px] truncate text-muted-foreground ${cellClass}`}
          title={student.groupName ?? "-"}
        >
          {student.groupName ?? "-"}
        </TableCell>
        <TableCell
          dir="ltr"
          className={`min-w-[95px] tabular-nums text-muted-foreground ${cellClass}`}
        >
          {student.registrationDate ?? "-"}
        </TableCell>
        <TableCell
          dir="ltr"
          className={`min-w-[95px] tabular-nums text-muted-foreground ${cellClass}`}
        >
          {student.endDate ?? "-"}
        </TableCell>
      </TableRow>
    ));

  const tableHeader = (
    <TableHeader>
      <TableRow className="border-b border-border hover:bg-transparent">
        <TableHead className="w-[52px] min-w-[52px] max-w-[52px] py-3.5 px-2 text-right align-middle" aria-hidden />
        <SortHeader column="identifier" label="ת״ז" />
        <SortHeader column="name" label="שם מלא" />
        <SortHeader column="status" label="סטטוס" />
        <SortHeader column="centerName" label="מרכז" />
        <SortHeader column="groupName" label="קבוצה" />
        <SortHeader column="registrationDate" label="תאריך הרשמה" />
        <SortHeader column="endDate" label="תאריך סיום" />
      </TableRow>
    </TableHeader>
  );

  const listIsEmpty = filteredStudents.length === 0;
  const totalStudents = data?.totalStudents ?? 0;
  const noStudentsAtAll = totalStudents === 0;

  if (isError && !data) {
    return (
      <div className="space-y-4">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              disabled
              placeholder="חיפוש תלמיד..."
              className="bg-secondary pr-10"
              aria-label="חיפוש תלמידים"
            />
          </div>
          <Button type="button" disabled className="bg-dojo-red/50">
            <Plus className="ml-2 h-4 w-4" />
            הוספת תלמיד
          </Button>
        </div>
        <Card className="border-destructive/30 bg-card">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm text-destructive" role="alert">
              {error instanceof Error ? error.message : "שגיאה בטעינת התלמידים"}
            </p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingWithoutData) {
    return (
      <>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              disabled
              placeholder="טוען..."
              className="bg-secondary pr-10"
              aria-label="חיפוש תלמידים"
            />
          </div>
          <Button type="button" disabled className="bg-dojo-red/50">
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            הוספת תלמיד
          </Button>
        </div>
        <div className="space-y-6">
          <ListLoadingBanner
            title="טוען נתוני תלמידים..."
            subtitle="אנא המתן — טוענים רשימת תלמידים מהשרת"
          />
          <StudentsListSkeletonDualSections />
        </div>
      </>
    );
  }

  if (!data) {
    return null;
  }

  const { centers, groups, beltLevels } = data;

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש תלמיד..."
            className="bg-secondary pr-10"
            aria-label="חיפוש תלמידים"
          />
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            if (!open && recordDialogBlockDismiss(createPhase, submitBusy)) return;
            setIsAddDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-dojo-red hover:bg-dojo-red/90">
              <Plus className="ml-2 h-4 w-4" />
              הוספת תלמיד
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[min(92vw,700px)] max-h-[80vh] flex flex-col overflow-hidden">
            <form
              action={formAction}
              encType="multipart/form-data"
              className="contents"
            >
              <div className="shrink-0 border-b border-border/70 px-6 pb-4 pt-6">
                <DialogHeader>
                  <DialogTitle>הוספת תלמיד חדש</DialogTitle>
                  <DialogDescription>הזן את פרטי התלמיד החדש</DialogDescription>
                </DialogHeader>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                <RecordDialogBodyLock
                  tailPhase={createPhase}
                  className="min-h-0"
                >
                <div className="grid gap-4">
                  <StudentImageUpload />
              <div className="grid gap-2">
                <Label htmlFor="identifier">ת״ז</Label>
                <Input
                  id="identifier"
                  name="identifier"
                  placeholder="תעודת זהות"
                  dir="ltr"
                  className="text-left"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="studentNumber">מספר תלמיד</Label>
                <Input
                  id="studentNumber"
                  name="studentNumber"
                  type="number"
                  min={0}
                  placeholder="מספר תלמיד"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 items-start">
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
                <Label htmlFor="gender">מין</Label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className={formNativeSelectClassName()}
                >
                  <option value="">בחר מין</option>
                  <option value="זכר">זכר</option>
                  <option value="נקבה">נקבה</option>
                </select>
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
                <p className="text-xs text-muted-foreground">אופציונלי</p>
              </div>
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="grid gap-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="03-0000000"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mobilePhone">פלאפון</Label>
                  <Input
                    id="mobilePhone"
                    name="mobilePhone"
                    placeholder="050-0000000"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
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
                <Input id="city" name="city" placeholder="עיר" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="street">רחוב</Label>
                <Input id="street" name="street" placeholder="רחוב ומספר בית" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postalCode">מיקוד</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="מיקוד"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="weight">משקל</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="ק״ג"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="centerId">מרכז</Label>
                <select
                  id="centerId"
                  name="centerId"
                  required
                  className={formNativeSelectClassName()}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
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
                <Label htmlFor="groupId">קבוצה</Label>
                <select
                  id="groupId"
                  name="groupId"
                  required
                  key={selectedCenterId}
                  disabled={!selectedCenterId}
                  className={formNativeSelectClassName()}
                >
                  <option value="">
                    {selectedCenterId ? "בחר קבוצה" : "בחר מרכז קודם"}
                  </option>
                  {filteredGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="grid gap-2">
                  <Label htmlFor="registrationDate">תאריך הרשמה</Label>
                  <Input
                    id="registrationDate"
                    name="registrationDate"
                    type="date"
                    required
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">תאריך סיום</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    אופציונלי – ריק = תלמיד פעיל (ללא תאריך סיום)
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parentName">הורה</Label>
                <Input id="parentName" name="parentName" placeholder="שם ההורה" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="parentPhone">טלפון הורה</Label>
                <Input
                  id="parentPhone"
                  name="parentPhone"
                  placeholder="050-0000000"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emergencyDetails">פרטי חירום</Label>
                <Textarea
                  id="emergencyDetails"
                  name="emergencyDetails"
                  placeholder="פרטי התקשרות במקרה חירום"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 items-start">
                <div className="grid gap-2">
                  <Label htmlFor="beltLevelId">דרגה</Label>
                  <select
                    id="beltLevelId"
                    name="beltLevelId"
                    className={formNativeSelectClassName()}
                  >
                    <option value="">ללא דרגה</option>
                    {beltLevels.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="beltDate">תאריך דרגה</Label>
                  <Input
                    id="beltDate"
                    name="beltDate"
                    type="date"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-muted-foreground">
                    נדרש כאשר נבחרה דרגה
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="beltCertificateNumber">מספר תעודה</Label>
                <Input
                  id="beltCertificateNumber"
                  name="beltCertificateNumber"
                  placeholder="אופציונלי"
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="hasMedicalApproval"
                  name="hasMedicalApproval"
                  type="checkbox"
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="hasMedicalApproval" className="cursor-pointer">
                  אישור רפואי
                </Label>
              </div>
                </div>
                </RecordDialogBodyLock>
              </div>
              <div className="shrink-0 space-y-3 border-t border-border/70 bg-background px-6 py-4">
                <RecordDialogSaveTailBanners
                  phase={createPhase}
                  bannerClassName="flex-row-reverse"
                />
                {state?.error && (
                  <p className="text-sm text-destructive" role="alert">
                    {state.error}
                  </p>
                )}
                <div className="flex justify-start gap-2">
                  {createPhase === "idle" && (
                    <>
                      <RecordDialogPrimarySubmitButton />
                      <RecordDialogCancelButton
                        onClick={() => setIsAddDialogOpen(false)}
                      />
                    </>
                  )}
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <StudentDetailsModal
        student={modalStudent}
        isLoading={modalLoading}
        loadError={modalLoadError}
        centers={centers}
        groups={groups}
        beltLevels={beltLevels}
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        onSaveSuccess={handleModalSaveSuccess}
        onStudentDataRefresh={refreshModalStudent}
        initialEditMode={modalInitialEditMode}
      />

      <div className="mt-1 space-y-8">
        {listIsEmpty ? (
          <Card className="rounded-lg border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-16 w-16 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {noStudentsAtAll && !searchQuery.trim()
                  ? "אין תלמידים במערכת"
                  : "אין תלמידים התואמים את החיפוש"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                {noStudentsAtAll && !searchQuery.trim()
                  ? "הוסף תלמיד חדש להתחלה"
                  : "נסה לשנות את מילות החיפוש"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <section>
              <h3 className="mb-3 text-base font-semibold text-foreground">
                תלמידים פעילים
                <span className="me-2 text-sm font-normal text-muted-foreground">
                  ({sortedActive.length})
                </span>
              </h3>
              {sortedActive.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין תלמידים פעילים התואמים את החיפוש</p>
              ) : (
                <Card className="overflow-hidden border-border/50 bg-card rounded-lg">
                  <CardContent className="p-0">
                    <Table>
                      {tableHeader}
                      <TableBody>{renderTableRows(sortedActive)}</TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </section>

            <section>
              <h3 className="mb-3 text-base font-semibold text-foreground">
                תלמידים לא פעילים
                <span className="me-2 text-sm font-normal text-muted-foreground">
                  ({sortedInactive.length})
                </span>
              </h3>
              {sortedInactive.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין תלמידים לא פעילים התואמים את החיפוש</p>
              ) : (
                <Card className="overflow-hidden border-border/50 bg-card rounded-lg">
                  <CardContent className="p-0">
                    <Table>
                      {tableHeader}
                      <TableBody>{renderTableRows(sortedInactive)}</TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        סה״כ {totalStudents} תלמידים
        {searchQuery.trim() ? (
          <>
            <span className="mx-2">•</span>
            {filteredStudents.length} לאחר סינון
          </>
        ) : null}
      </p>
    </>
  );
}

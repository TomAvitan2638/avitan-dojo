"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  MapPin,
  Users,
  Pencil,
  Phone,
  Award,
  Mail,
  Building2,
  Loader2,
} from "lucide-react";
import { StudentEditForm } from "@/app/(dashboard)/dashboard/students/[id]/student-edit-form";
import { StudentBeltHistoryReadOnly } from "@/components/students/student-belt-history-read-only";
import { RECORD_DIALOG_AUTOCLOSE_MS } from "@/components/record-dialog/record-dialog-save-ux";
import { format } from "date-fns";

export type StudentFormData = {
  id: string;
  identifier: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  phone: string;
  mobilePhone: string;
  email: string;
  city: string;
  street: string;
  postalCode: string;
  weight: string;
  centerId: string;
  groupId: string;
  registrationDate: string;
  endDate: string;
  parentName: string;
  parentPhone: string;
  emergencyDetails: string;
  beltLevelId: string;
  beltDate: string;
  beltCertificateNumber: string;
  hasMedicalApproval: boolean;
  photoUrl: string | null;
};

export type StudentForModal = {
  id: string;
  identifier: string;
  studentNumber: number | null;
  firstName: string;
  lastName: string;
  status: string;
  gender: string | null;
  birthDate: string | null;
  birthDateRaw: string | null;
  phone: string | null;
  mobilePhone: string | null;
  email: string | null;
  city: string | null;
  street: string | null;
  postalCode: string | null;
  weight: number | null;
  parentName: string | null;
  parentPhone: string | null;
  emergencyDetails: string | null;
  hasMedicalApproval: boolean;
  photoUrl: string | null;
  centerName: string | null;
  groupName: string | null;
  centerId: string | null;
  groupId: string | null;
  registrationDate: string | null;
  endDate: string | null;
  registrationDateRaw: string | Date | null;
  endDateRaw: string | Date | null;
  beltLevelId: string | null;
  beltName: string | null;
  beltDate: string | null;
  beltDateRaw: string | Date | null;
  beltCertificateNumber: string | null;
  beltHistory?: { id: string; beltName: string; promotionDate: string; createdAt: string; certificateNumber: string | null }[];
};

type CenterOption = { id: string; name: string };
type GroupOption = { id: string; name: string; centerId: string };
type BeltOption = { id: string; name: string };

type Props = {
  student: StudentForModal | null;
  /** When true, full details are loading (open with no student yet). */
  isLoading?: boolean;
  /** Shown when fetch failed (e.g. not found / forbidden). */
  loadError?: string | null;
  centers: CenterOption[];
  groups: GroupOption[];
  beltLevels: BeltOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  onSaveSuccess?: () => void;
  /** Refetch modal student after belt history delete (parent supplies `getStudentForModal`). */
  onStudentDataRefresh?: () => Promise<void>;
  initialEditMode?: boolean;
};

function parseDdMmYyyyToYyyyMmDd(s: string | null | undefined): string {
  if (!s) return "";
  const parts = s.split("/");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return s;
}

function toEditFormData(student: StudentForModal): StudentFormData {
  const toDateStr = (d: Date | string | null | undefined): string =>
    d ? format(new Date(d), "yyyy-MM-dd") : "";

  return {
    id: student.id,
    identifier: student.identifier,
    studentNumber: student.studentNumber?.toString() ?? "",
    firstName: student.firstName,
    lastName: student.lastName,
    gender: student.gender ?? "",
    birthDate: toDateStr(student.birthDateRaw) || parseDdMmYyyyToYyyyMmDd(student.birthDate),
    phone: student.phone ?? "",
    mobilePhone: student.mobilePhone ?? "",
    email: student.email ?? "",
    city: student.city ?? "",
    street: student.street ?? "",
    postalCode: student.postalCode ?? "",
    weight: student.weight?.toString() ?? "",
    centerId: student.centerId ?? "",
    groupId: student.groupId ?? "",
    registrationDate: toDateStr(student.registrationDateRaw),
    endDate: toDateStr(student.endDateRaw),
    parentName: student.parentName ?? "",
    parentPhone: student.parentPhone ?? "",
    emergencyDetails: student.emergencyDetails ?? "",
    beltLevelId: student.beltLevelId ?? "",
    beltDate: toDateStr(student.beltDateRaw),
    beltCertificateNumber: student.beltCertificateNumber ?? "",
    hasMedicalApproval: student.hasMedicalApproval ?? false,
    photoUrl: student.photoUrl,
  };
}

export function StudentDetailsModal({
  student,
  isLoading = false,
  loadError = null,
  centers,
  groups,
  beltLevels,
  open,
  onOpenChange,
  onClose,
  onSaveSuccess,
  onStudentDataRefresh,
  initialEditMode = false,
}: Props) {
  const [mode, setMode] = useState<"view" | "edit">(
    initialEditMode ? "edit" : "view"
  );
  const autoCloseAfterSaveRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (open && student) {
      setMode(initialEditMode ? "edit" : "view");
    }
  }, [open, student?.id, initialEditMode]);

  useEffect(() => {
    return () => {
      if (autoCloseAfterSaveRef.current != null) {
        clearTimeout(autoCloseAfterSaveRef.current);
      }
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (autoCloseAfterSaveRef.current != null) {
        clearTimeout(autoCloseAfterSaveRef.current);
        autoCloseAfterSaveRef.current = null;
      }
      setMode("view");
      onClose?.();
    }
    onOpenChange(next);
  };

  const handleEditSuccess = () => {
    onSaveSuccess?.();
    if (autoCloseAfterSaveRef.current != null) {
      clearTimeout(autoCloseAfterSaveRef.current);
    }
    autoCloseAfterSaveRef.current = setTimeout(() => {
      autoCloseAfterSaveRef.current = null;
      handleOpenChange(false);
    }, RECORD_DIALOG_AUTOCLOSE_MS);
  };

  if (!student && !isLoading && !loadError) return null;

  const firstName = student?.firstName ?? "";
  const lastName = student?.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "תלמיד";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.trim() || "?";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border-border bg-card shadow-lg ring-1 ring-border/40"
        overlayClassName="bg-foreground/45 backdrop-blur-sm"
      >
        {isLoading && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
            role="status"
            aria-busy="true"
          >
            <Loader2 className="h-10 w-10 animate-spin text-dojo-red" />
            <p className="text-base">טוען פרטי תלמיד...</p>
          </div>
        )}
        {loadError && !isLoading && (
          <div className="space-y-4 py-6">
            <p className="text-center text-destructive" role="alert">
              {loadError}
            </p>
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                סגור
              </Button>
            </div>
          </div>
        )}
        {student && !isLoading && !loadError && mode === "view" ? (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">{fullName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-border">
                  {student.photoUrl ? (
                    <AvatarImage
                      src={student.photoUrl}
                      alt={fullName}
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback className="bg-dojo-red/10 text-xl text-dojo-red">
                      {initials}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{fullName}</h2>
                  <p className="mt-1 text-muted-foreground">ת״ז: {student.identifier}</p>
                  <p className="text-sm text-muted-foreground">
                    סטטוס: {student.status === "active" ? "פעיל" : "לא פעיל"}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">פרטים אישיים</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">ת״ז:</span>
                      <span className="text-foreground" dir="ltr">{student.identifier}</span>
                    </div>
                    {student.studentNumber != null && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">מספר תלמיד:</span>
                        <span className="text-foreground">{student.studentNumber}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <span className="text-muted-foreground">שם:</span>
                      <span className="text-foreground">{fullName}</span>
                    </div>
                    {student.gender && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">מין:</span>
                        <span className="text-foreground">{student.gender}</span>
                      </div>
                    )}
                    {student.birthDate && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">תאריך לידה:</span>
                        <span className="text-foreground">{student.birthDate}</span>
                      </div>
                    )}
                    {student.registrationDate && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">תאריך הרשמה:</span>
                        <span className="text-foreground">{student.registrationDate}</span>
                      </div>
                    )}
                    {student.endDate && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">תאריך סיום:</span>
                        <span className="text-foreground">{student.endDate}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Users className="h-4 w-4" />
                      שיוך
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {student.centerName && (
                      <div className="flex gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">מרכז: {student.centerName}</span>
                      </div>
                    )}
                    {student.groupName && (
                      <div className="flex gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">קבוצה: {student.groupName}</span>
                      </div>
                    )}
                    {!student.centerName && !student.groupName && (
                      <p className="text-muted-foreground">אין שיוך פעיל</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Phone className="h-4 w-4" />
                      יצירת קשר
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {student.phone && (
                      <div className="flex gap-2" dir="ltr">
                        <span className="text-muted-foreground">טלפון:</span>
                        <span className="text-foreground">{student.phone}</span>
                      </div>
                    )}
                    {student.mobilePhone && (
                      <div className="flex gap-2" dir="ltr">
                        <span className="text-muted-foreground">פלאפון:</span>
                        <span className="text-foreground">{student.mobilePhone}</span>
                      </div>
                    )}
                    {student.email && (
                      <div className="flex gap-2" dir="ltr">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{student.email}</span>
                      </div>
                    )}
                    {!student.phone && !student.mobilePhone && !student.email && (
                      <p className="text-muted-foreground">לא הוזנו</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Building2 className="h-4 w-4" />
                      כתובת
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {student.city && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">עיר:</span>
                        <span className="text-foreground">{student.city}</span>
                      </div>
                    )}
                    {student.street && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">רחוב:</span>
                        <span className="text-foreground">{student.street}</span>
                      </div>
                    )}
                    {student.postalCode && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">מיקוד:</span>
                        <span className="text-foreground" dir="ltr">{student.postalCode}</span>
                      </div>
                    )}
                    {!student.city && !student.street && !student.postalCode && (
                      <p className="text-muted-foreground">לא הוזנה</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card sm:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">משפחה וחירום</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {student.parentName && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">הורה:</span>
                        <span className="text-foreground">{student.parentName}</span>
                      </div>
                    )}
                    {student.parentPhone && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">טלפון הורה:</span>
                        <span className="text-foreground" dir="ltr">{student.parentPhone}</span>
                      </div>
                    )}
                    {student.emergencyDetails && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">פרטי חירום:</span>
                        <span className="text-foreground">{student.emergencyDetails}</span>
                      </div>
                    )}
                    {!student.parentName &&
                      !student.parentPhone &&
                      !student.emergencyDetails && (
                        <p className="text-muted-foreground">לא הוזנו</p>
                      )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-foreground">
                      <Award className="h-4 w-4" />
                      דרגה
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {student.beltName && student.beltDate ? (
                      <div className="space-y-1">
                        <p className="text-foreground">
                          {student.beltName} ({student.beltDate})
                        </p>
                        {student.beltCertificateNumber && (
                          <p className="text-muted-foreground">
                            מספר תעודה: {student.beltCertificateNumber}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">אין דרגה</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base text-foreground">פרטים נוספים</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {student.weight != null && (
                      <p className="text-foreground">משקל: {student.weight} ק״ג</p>
                    )}
                    <p className="text-foreground">
                      אישור רפואי: {student.hasMedicalApproval ? "כן" : "לא"}
                    </p>
                  </CardContent>
                </Card>

                <StudentBeltHistoryReadOnly
                  beltHistory={student.beltHistory}
                  fullWidth
                />
              </div>

              <div className="flex justify-start gap-2 border-t border-border pt-6 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("edit")}
                >
                  <Pencil className="ml-1 h-4 w-4" />
                  עריכה
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
                  סגור
                </Button>
              </div>
            </div>
          </>
        ) : student && !isLoading && !loadError && mode === "edit" ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">עריכת פרטי תלמיד</h2>
            <StudentEditForm
              key={`edit-${student.id}-belt-${student.beltHistory?.[0]?.id ?? "none"}`}
              student={toEditFormData(student)}
              centers={centers}
              groups={groups}
              beltLevels={beltLevels}
              noRedirect
              hideNavigation
              onCancel={() => setMode("view")}
              onSuccess={handleEditSuccess}
            />
            <StudentBeltHistoryReadOnly
              beltHistory={student.beltHistory}
              allowDelete
              studentId={student.id}
              onAfterDeleteSuccess={onStudentDataRefresh}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

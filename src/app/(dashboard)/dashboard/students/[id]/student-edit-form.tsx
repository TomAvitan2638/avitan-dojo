"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateStudent } from "@/server/actions/update-student";
import { invalidateStudentsPageAndDashboardHome } from "@/lib/students-page-query";
import { StudentImageUpload } from "@/components/students/student-image-upload";
import { formNativeSelectClassName } from "@/lib/form-field";
import { Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

function SubmitButton({
  hideNavigation,
  showSavedState,
}: {
  hideNavigation: boolean;
  showSavedState?: boolean;
}) {
  const { pending } = useFormStatus();

  if (showSavedState && !pending) {
    return (
      <Button
        type="button"
        className="bg-green-600/20 text-green-600 dark:text-green-400 hover:bg-green-600/20"
        disabled
      >
        <CheckCircle className="ml-2 h-4 w-4" />
        נשמר בהצלחה
      </Button>
    );
  }

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

type StudentFormData = {
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

type CenterOption = { id: string; name: string };
type GroupOption = { id: string; name: string; centerId: string };
type BeltOption = { id: string; name: string };

type Props = {
  student: StudentFormData;
  centers: CenterOption[];
  groups: GroupOption[];
  beltLevels: BeltOption[];
  noRedirect?: boolean;
  hideNavigation?: boolean;
  onSuccess?: () => void;
};

export function StudentEditForm({
  student,
  centers,
  groups,
  beltLevels,
  noRedirect = false,
  hideNavigation = false,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedCenterId, setSelectedCenterId] = useState(student.centerId);
  const [showSuccess, setShowSuccess] = useState(false);
  const [state, formAction] = useFormState(
    updateStudent.bind(null, student.id),
    null
  );

  useEffect(() => {
    if (state?.success) {
      void invalidateStudentsPageAndDashboardHome(queryClient);
      if (onSuccess) {
        onSuccess();
      }
      setShowSuccess(true);
    }
  }, [state?.success, onSuccess, queryClient]);

  useEffect(() => {
    if (state?.error) {
      setShowSuccess(false);
    }
  }, [state?.error]);

  const handleFormChange = () => {
    setShowSuccess(false);
  };

  const showError = state?.error;

  const modalInputClass =
    "bg-muted border-border focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary";

  const filteredGroups = selectedCenterId
    ? groups.filter((g) => g.centerId === selectedCenterId)
    : [];

  return (
    <Card className="max-w-2xl border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">עריכת פרטי תלמיד</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          encType="multipart/form-data"
          className="grid gap-6"
          onInput={handleFormChange}
          onChange={handleFormChange}
        >
          {noRedirect && (
            <input type="hidden" name="noRedirect" value="true" />
          )}
          <StudentImageUpload currentPhotoUrl={student.photoUrl} />
          <div className="grid gap-2">
            <Label htmlFor="identifier">ת״ז</Label>
            <Input
              id="identifier"
              name="identifier"
              placeholder="תעודת זהות"
              dir="ltr"
              className={`text-left text-foreground ${modalInputClass}`}
              defaultValue={student.identifier}
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
              className={`text-left text-foreground ${modalInputClass}`}
              defaultValue={student.studentNumber}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="grid gap-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="שם פרטי"
                className={`text-foreground ${modalInputClass}`}
                defaultValue={student.firstName}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="שם משפחה"
                className={`text-foreground ${modalInputClass}`}
                defaultValue={student.lastName}
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
              defaultValue={student.gender}
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
              className={`text-left text-foreground ${modalInputClass}`}
              defaultValue={student.birthDate}
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
                className={`text-left text-foreground ${modalInputClass}`}
                defaultValue={student.phone}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobilePhone">פלאפון</Label>
              <Input
                id="mobilePhone"
                name="mobilePhone"
                placeholder="050-0000000"
                dir="ltr"
                className={`text-left text-foreground ${modalInputClass}`}
                defaultValue={student.mobilePhone}
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
              className={`text-left text-foreground ${modalInputClass}`}
              defaultValue={student.email}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">עיר</Label>
            <Input
              id="city"
              name="city"
              placeholder="עיר"
              className={`text-foreground ${modalInputClass}`}
              defaultValue={student.city}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="street">רחוב</Label>
            <Input
              id="street"
              name="street"
              placeholder="רחוב ומספר בית"
              className={`text-foreground ${modalInputClass}`}
              defaultValue={student.street}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postalCode">מיקוד</Label>
            <Input
              id="postalCode"
              name="postalCode"
              placeholder="מיקוד"
              dir="ltr"
              className={`text-left text-foreground ${modalInputClass}`}
              defaultValue={student.postalCode}
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
              className={`text-left text-foreground ${modalInputClass}`}
              defaultValue={student.weight}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="centerId">מרכז</Label>
            <select
              id="centerId"
              name="centerId"
              required
              defaultValue={student.centerId}
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
              defaultValue={student.groupId}
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
                className={`text-left ${modalInputClass}`}
                defaultValue={student.registrationDate}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">תאריך סיום</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                dir="ltr"
                className={`text-left ${modalInputClass}`}
                defaultValue={student.endDate}
              />
              <p className="text-xs text-muted-foreground">
                אופציונלי – ריק = תלמיד פעיל (ללא תאריך סיום)
              </p>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="parentName">הורה</Label>
            <Input
              id="parentName"
              name="parentName"
              placeholder="שם ההורה"
              className={modalInputClass}
              defaultValue={student.parentName}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="parentPhone">טלפון הורה</Label>
            <Input
              id="parentPhone"
              name="parentPhone"
              placeholder="050-0000000"
              dir="ltr"
              className={`text-left ${modalInputClass}`}
              defaultValue={student.parentPhone}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="emergencyDetails">פרטי חירום</Label>
            <Textarea
              id="emergencyDetails"
              name="emergencyDetails"
              placeholder="פרטי התקשרות במקרה חירום"
              className={modalInputClass}
              defaultValue={student.emergencyDetails}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="grid gap-2">
              <Label htmlFor="beltLevelId">דרגה</Label>
              <select
                id="beltLevelId"
                name="beltLevelId"
                className={formNativeSelectClassName()}
                defaultValue={student.beltLevelId}
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
                className={`text-left ${modalInputClass}`}
                defaultValue={student.beltDate}
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
              className={`text-left ${modalInputClass}`}
              defaultValue={student.beltCertificateNumber}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="hasMedicalApproval"
              name="hasMedicalApproval"
              type="checkbox"
              defaultChecked={student.hasMedicalApproval}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="hasMedicalApproval" className="cursor-pointer">
              אישור רפואי
            </Label>
          </div>
          {showError && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2 border-t border-border pt-6 mt-2">
            <SubmitButton
              hideNavigation={hideNavigation}
              showSavedState={showSuccess}
            />
            {!hideNavigation && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/students/${student.id}`}>
                    חזרה לפרטי תלמיד
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/students">חזרה לתלמידים</Link>
                </Button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

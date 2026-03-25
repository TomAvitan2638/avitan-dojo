"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  MapPin,
  Users,
  Pencil,
  FileText,
  Phone,
  Award,
  Calendar,
  Mail,
  Building2,
} from "lucide-react";
import Link from "next/link";

type StudentData = {
  id: string;
  identifier: string;
  status: string;
  studentNumber: number | null;
  firstName: string;
  lastName: string;
  gender: string | null;
  birthDate: string | null;
  registrationDate: string | null;
  endDate: string | null;
  centerName: string | null;
  groupName: string | null;
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
  beltName: string | null;
  beltDate: string | null;
  beltCertificateNumber: string | null;
  photoUrl: string | null;
};

type Props = {
  student: StudentData;
};

export function StudentDetailsClient({ student }: Props) {
  const fullName = `${student.firstName} ${student.lastName}`;
  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
            {student.studentNumber != null && (
              <p className="text-sm text-muted-foreground">
                מספר תלמיד: {student.studentNumber}
              </p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/students/${student.id}/edit`}>
            <Pencil className="ml-1 h-4 w-4" />
            עריכה
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">פרטים אישיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">ת״ז:</span>
              <span dir="ltr">{student.identifier}</span>
            </div>
            {student.studentNumber != null && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">מספר תלמיד:</span>
                <span dir="ltr">{student.studentNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">שם פרטי:</span>
              <span>{student.firstName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">שם משפחה:</span>
              <span>{student.lastName}</span>
            </div>
            {student.gender && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">מין:</span>
                <span>{student.gender}</span>
              </div>
            )}
            {student.birthDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>תאריך לידה: {student.birthDate}</span>
              </div>
            )}
            {student.registrationDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>תאריך הרשמה: {student.registrationDate}</span>
              </div>
            )}
            {student.endDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>תאריך סיום: {student.endDate}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              שיוך
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.centerName && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>מרכז: {student.centerName}</span>
              </div>
            )}
            {student.groupName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>קבוצה: {student.groupName}</span>
              </div>
            )}
            {!student.centerName && !student.groupName && (
              <p className="py-2 text-sm text-muted-foreground">
                אין שיוך פעיל. ניתן לערוך את התלמיד כדי לשייך אותו לקבוצה.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5" />
              יצירת קשר
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">טלפון: {student.phone}</span>
              </div>
            )}
            {student.mobilePhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">פלאפון: {student.mobilePhone}</span>
              </div>
            )}
            {student.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{student.email}</span>
              </div>
            )}
            {!student.phone && !student.mobilePhone && !student.email && (
              <p className="py-2 text-sm text-muted-foreground">
                לא הוזנו פרטי יצירת קשר.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              כתובת
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>עיר: {student.city}</span>
              </div>
            )}
            {student.street && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>רחוב: {student.street}</span>
              </div>
            )}
            {student.postalCode && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">מיקוד:</span>
                <span dir="ltr">{student.postalCode}</span>
              </div>
            )}
            {!student.city && !student.street && !student.postalCode && (
              <p className="py-2 text-sm text-muted-foreground">
                לא הוזנה כתובת.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">משפחה וחירום</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.parentName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>הורה: {student.parentName}</span>
              </div>
            )}
            {student.parentPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{student.parentPhone}</span>
              </div>
            )}
            {student.emergencyDetails && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>פרטי חירום: {student.emergencyDetails}</span>
              </div>
            )}
            {!student.parentName &&
              !student.parentPhone &&
              !student.emergencyDetails && (
                <p className="py-2 text-sm text-muted-foreground">
                  לא הוזנו פרטי משפחה וחירום.
                </p>
              )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5" />
              דרגה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.beltName && student.beltDate ? (
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">דרגה נוכחית:</span>{" "}
                  {student.beltName}
                </p>
                <p>
                  <span className="text-muted-foreground">תאריך דרגה:</span>{" "}
                  {student.beltDate}
                </p>
                {student.beltCertificateNumber && (
                  <p>
                    <span className="text-muted-foreground">מספר תעודה:</span>{" "}
                    {student.beltCertificateNumber}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                אין דרגה מוגדרת – ניתן לערוך ולעדכן
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">פרטים נוספים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student.weight != null && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">משקל:</span>
                <span>{student.weight} ק״ג</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">אישור רפואי:</span>
              <span>{student.hasMedicalApproval ? "כן" : "לא"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

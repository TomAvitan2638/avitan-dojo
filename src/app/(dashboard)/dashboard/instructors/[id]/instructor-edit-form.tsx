"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateInstructor } from "@/server/actions/update-instructor";
import { InstructorImageUpload } from "@/components/instructors/instructor-image-upload";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function InstructorEditSubmitButton() {
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

type InstructorFormData = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  birthDate: string;
  notes: string;
  photoUrl: string;
  isActive: boolean;
};

type Props = {
  instructor: InstructorFormData;
};

export function InstructorEditForm({ instructor }: Props) {
  const [state, formAction] = useFormState(
    updateInstructor.bind(null, instructor.id),
    null
  );

  return (
    <Card className="border-border/50 bg-card max-w-2xl">
      <CardHeader>
        <CardTitle>עריכת פרטי מאמן</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={formAction}
          className="grid gap-4"
          encType="multipart/form-data"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">שם פרטי</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="שם פרטי"
                defaultValue={instructor.firstName}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">שם משפחה</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="שם משפחה"
                defaultValue={instructor.lastName}
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
              defaultValue={instructor.phone}
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
              defaultValue={instructor.email}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">עיר</Label>
            <Input
              id="city"
              name="city"
              placeholder="הזן עיר"
              defaultValue={instructor.city}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              name="address"
              placeholder="הזן כתובת"
              defaultValue={instructor.address}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="birthDate">תאריך לידה</Label>
            <Input
              id="birthDate"
              name="birthDate"
              type="date"
              dir="ltr"
              className="text-left"
              defaultValue={instructor.birthDate}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">הערות</Label>
            <Input
              id="notes"
              name="notes"
              placeholder="הערות"
              defaultValue={instructor.notes}
            />
          </div>
          <InstructorImageUpload currentPhotoUrl={instructor.photoUrl} />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={instructor.isActive}
              className="rounded border-input"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              מאמן פעיל
            </Label>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex gap-2">
            <InstructorEditSubmitButton />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/instructors/${instructor.id}`}>
                ביטול
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

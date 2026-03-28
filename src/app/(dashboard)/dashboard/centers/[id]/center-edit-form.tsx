"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateCenter } from "@/server/actions/update-center";
import { formNativeSelectClassName } from "@/lib/form-field";
import Link from "next/link";
import { Loader2 } from "lucide-react";

function CenterEditSubmitButton() {
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

type CenterFormData = {
  id: string;
  name: string;
  instructorId: string;
  price: string;
  notes: string;
};

type InstructorOption = {
  id: string;
  name: string;
};

type Props = {
  center: CenterFormData;
  instructors: InstructorOption[];
  noRedirect?: boolean;
  hideNavigation?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function CenterEditForm({
  center,
  instructors,
  noRedirect = false,
  hideNavigation = false,
  onSuccess,
  onCancel,
}: Props) {
  const [state, formAction] = useFormState(
    updateCenter.bind(null, center.id),
    null
  );

  useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  return (
    <Card className="border-border/50 bg-card max-w-2xl">
      <CardHeader>
        <CardTitle>עריכת פרטי מרכז</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          {noRedirect ? (
            <input type="hidden" name="noRedirect" value="true" />
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="name">שם המרכז</Label>
            <Input
              id="name"
              name="name"
              placeholder="הזן שם מרכז"
              defaultValue={center.name}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="instructorId">מאמן אחראי</Label>
            <select
              id="instructorId"
              name="instructorId"
              defaultValue={center.instructorId}
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
              defaultValue={center.price}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="הערות נוספות"
              defaultValue={center.notes}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex gap-2">
            <CenterEditSubmitButton />
            {hideNavigation && onCancel ? (
              <Button type="button" variant="outline" onClick={onCancel}>
                ביטול
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href={`/dashboard/centers/${center.id}`}>ביטול</Link>
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

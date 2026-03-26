"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  recordPayment,
  type RecordPaymentState,
} from "@/server/actions/record-payment";
import {
  PAYMENT_METHODS_FOR_REGULAR,
  getPaymentMethodLabel,
} from "@/lib/payment-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { formNativeSelectClassName } from "@/lib/form-field";

function RecordPaymentSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          רושם...
        </>
      ) : (
        "רישום תשלום"
      )}
    </Button>
  );
}

type Props = {
  membershipId: string;
  studentId: string;
  studentName: string;
  groupName: string;
};

export function RecordPaymentForm({
  membershipId,
  studentId,
  studentName,
  groupName,
}: Props) {
  const [state, formAction] = useFormState<RecordPaymentState | null, FormData>(
    recordPayment,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="studentId" value={studentId} />

      <div className="rounded-lg border border-border bg-secondary/50 p-4">
        <p className="font-medium text-foreground">{studentName}</p>
        <p className="text-sm text-muted-foreground">{groupName}</p>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">סכום *</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="0.00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">אמצעי תשלום *</Label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          required
          className={formNativeSelectClassName()}
        >
          {PAYMENT_METHODS_FOR_REGULAR.map((method) => (
            <option key={method} value={method}>
              {getPaymentMethodLabel(method)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextPaymentDueDate">
          תאריך תשלום הבא (אופציונלי)
        </Label>
        <Input
          id="nextPaymentDueDate"
          name="nextPaymentDueDate"
          type="date"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <RecordPaymentSubmitButton />
        <Button variant="outline" asChild>
          <Link href="/dashboard">ביטול</Link>
        </Button>
      </div>
    </form>
  );
}

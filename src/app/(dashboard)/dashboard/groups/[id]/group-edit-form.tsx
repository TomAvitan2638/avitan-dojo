"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { updateGroup } from "@/server/actions/update-group";
import Link from "next/link";
import { TRAINING_DAYS_ORDER, TRAINING_DAY_LABELS } from "@/lib/training-days";
import {
  formNativeSelectClassName,
  formNativeSelectCompactClassName,
} from "@/lib/form-field";
import type { TrainingDay } from "@prisma/client";
import { Plus, Trash2, Loader2 } from "lucide-react";

function GroupEditSubmitButton() {
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

type ScheduleSlot = {
  trainingDay: TrainingDay;
  startTime: string;
  endTime: string;
};

type GroupFormData = {
  id: string;
  name: string;
  centerId: string;
  instructorId: string;
  notes: string;
  schedules: ScheduleSlot[];
};

type CenterOption = { id: string; name: string };
type InstructorOption = { id: string; name: string };

type Props = {
  group: GroupFormData;
  centers: CenterOption[];
  instructors: InstructorOption[];
};

export function GroupEditForm({ group, centers, instructors }: Props) {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(group.schedules);
  const [state, formAction] = useFormState(
    updateGroup.bind(null, group.id),
    null
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

  const updateSchedule = (
    idx: number,
    field: keyof ScheduleSlot,
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  return (
    <Card className="border-border/50 bg-card max-w-2xl">
      <CardHeader>
        <CardTitle>עריכת פרטי קבוצה</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
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
              defaultValue={group.name}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="centerId">מרכז</Label>
            <select
              id="centerId"
              name="centerId"
              required
              defaultValue={group.centerId}
              className={formNativeSelectClassName()}
            >
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
              defaultValue={group.instructorId}
              className={formNativeSelectClassName()}
            >
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
              <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
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
              defaultValue={group.notes}
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <div className="flex gap-2">
            <GroupEditSubmitButton />
            <Button variant="outline" asChild>
              <Link href={`/dashboard/groups/${group.id}`}>ביטול</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

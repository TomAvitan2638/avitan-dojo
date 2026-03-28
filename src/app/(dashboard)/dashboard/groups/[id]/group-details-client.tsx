"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, MapPin, Users, Pencil, Calendar, Clock, FileText } from "lucide-react";
import Link from "next/link";

type GroupData = {
  id: string;
  name: string;
  centerName: string;
  instructorName: string;
  notes: string | null;
  studentsCount: number;
  scheduleSummary: { day: string; time: string }[];
};

type Props = {
  group: GroupData;
  /** When set, "עריכה" uses this callback instead of navigating to the edit route (e.g. modal). */
  onEditClick?: () => void;
};

export function GroupDetailsClient({ group, onEditClick }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">{group.name}</h2>
        {onEditClick ? (
          <Button variant="outline" size="sm" type="button" onClick={onEditClick}>
            <Pencil className="ml-1 h-4 w-4" />
            עריכה
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/groups/${group.id}/edit`}>
              <Pencil className="ml-1 h-4 w-4" />
              עריכה
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">פרטי קבוצה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>מרכז: {group.centerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>מאמן: {group.instructorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                <strong className="text-dojo-red">{group.studentsCount}</strong>{" "}
                תלמידים
              </span>
            </div>
            {group.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{group.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {group.scheduleSummary.length > 0 && (
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                לוח זמנים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {group.scheduleSummary.map((slot, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                  >
                    <span className="font-medium">{slot.day}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {slot.time}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {group.scheduleSummary.length === 0 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            אין לוח זמנים מוגדר
          </CardContent>
        </Card>
      )}
    </div>
  );
}

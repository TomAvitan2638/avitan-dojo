"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Banknote, Users, Pencil, FileText } from "lucide-react";
import Link from "next/link";

type CenterData = {
  id: string;
  name: string;
  instructorName: string | null;
  instructorId: string | null;
  price: number | null;
  notes: string | null;
};

type GroupInfo = {
  id: string;
  name: string;
};

type Props = {
  center: CenterData;
  groups: GroupInfo[];
  /** When set, "עריכה" uses this callback instead of navigating to the edit route (e.g. modal). */
  onEditClick?: () => void;
};

export function CenterDetailsClient({ center, groups, onEditClick }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-bold text-foreground">{center.name}</h2>
        {onEditClick ? (
          <Button variant="outline" size="sm" type="button" onClick={onEditClick}>
            <Pencil className="ml-1 h-4 w-4" />
            עריכה
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/centers/${center.id}/edit`}>
              <Pencil className="ml-1 h-4 w-4" />
              עריכה
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">פרטי מרכז</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {center.instructorName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>מאמן אחראי: {center.instructorName}</span>
              </div>
            )}
            {center.price != null && (
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold text-dojo-gold">
                  ₪{center.price}
                </span>
                <span className="text-muted-foreground">/ חודש</span>
              </div>
            )}
            {center.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{center.notes}</span>
              </div>
            )}
            {!center.instructorName &&
              center.price == null &&
              !center.notes && (
                <p className="text-sm text-muted-foreground">אין פרטים נוספים</p>
              )}
          </CardContent>
        </Card>

        {groups.length > 0 && (
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                קבוצות ({groups.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {groups.map((group) => (
                  <li
                    key={group.id}
                    className="rounded-lg bg-secondary/50 p-3 font-medium"
                  >
                    {group.name}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {groups.length === 0 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            אין קבוצות משויכות למרכז זה
          </CardContent>
        </Card>
      )}
    </div>
  );
}

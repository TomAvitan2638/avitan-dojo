"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Users, Award, User } from "lucide-react";

export type BeltHistoryEntry = {
  id: string;
  beltName: string;
  beltOrder: number;
  promotionDate: string;
  promotionDateRaw: Date;
  createdAt: string;
  createdAtRaw: Date;
};

export type StudentForBeltModal = {
  id: string;
  name: string;
  identifier: string;
  photoUrl: string | null;
  centerName: string | null;
  groupName: string | null;
  currentBeltName: string | null;
  currentBeltDate: string | null;
  beltHistory: BeltHistoryEntry[];
};

type Props = {
  student: StudentForBeltModal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BeltHistoryModal({ student, open, onOpenChange }: Props) {
  if (!student) return null;

  const initials = student.name
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .slice(0, 2) || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl border-border bg-card shadow-lg ring-1 ring-border/40"
        overlayClassName="bg-foreground/45 backdrop-blur-sm"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">{student.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border">
              {student.photoUrl ? (
                <AvatarImage
                  src={student.photoUrl}
                  alt={student.name}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-dojo-red/10 text-xl text-dojo-red">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{student.name}</h2>
              <p className="mt-1 text-muted-foreground" dir="ltr">
                ת״ז: {student.identifier}
              </p>
              {(student.centerName || student.groupName) && (
                <p className="text-sm text-muted-foreground">
                  {student.centerName && `מרכז: ${student.centerName}`}
                  {student.centerName && student.groupName && " • "}
                  {student.groupName && `קבוצה: ${student.groupName}`}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <MapPin className="h-4 w-4" />
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
                    <Users className="h-4 w-4 text-muted-foreground" />
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
                  <Award className="h-4 w-4" />
                  דרגה נוכחית
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {student.currentBeltName ? (
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">{student.currentBeltName}</p>
                    {student.currentBeltDate && (
                      <p className="text-muted-foreground" dir="ltr">
                        תאריך: {student.currentBeltDate}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">אין דרגה</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Award className="h-4 w-4" />
                היסטוריית דרגות
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.beltHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-right text-muted-foreground">
                        דרגה
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground">
                        תאריך קבלת דרגה
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground">
                        תאריך עדכון
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.beltHistory.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="border-border/50 hover:bg-muted/40"
                      >
                        <TableCell className="font-medium text-foreground">
                          {entry.beltName}
                        </TableCell>
                        <TableCell
                          dir="ltr"
                          className="text-muted-foreground tabular-nums"
                        >
                          {entry.promotionDate}
                        </TableCell>
                        <TableCell
                          dir="ltr"
                          className="text-muted-foreground tabular-nums text-sm"
                        >
                          {entry.createdAt}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-4 text-center text-muted-foreground">
                  אין היסטוריית דרגות
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

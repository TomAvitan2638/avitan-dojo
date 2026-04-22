"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { MapPin, Users, Award, Loader2, Trash2 } from "lucide-react";

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

type DeleteResult = { success?: boolean; error?: string };

type Props = {
  student: StudentForBeltModal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Parent-owned deletion: executes the server action, refreshes list data,
   * and removes the row from the modal snapshot. Returns the action result
   * so the modal can display errors without closing.
   */
  onDeleteEntry?: (entryId: string) => Promise<DeleteResult>;
};

export function BeltHistoryModal({
  student,
  open,
  onOpenChange,
  onDeleteEntry,
}: Props) {
  const [deleteTarget, setDeleteTarget] = useState<BeltHistoryEntry | null>(
    null
  );
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  useEffect(() => {
    if (!open) {
      setDeleteTarget(null);
      setDeletePending(false);
      setDeleteError(undefined);
    }
  }, [open]);

  if (!student) return null;

  const initials =
    student.name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .slice(0, 2) || "?";

  const isLatestEntry = (entry: BeltHistoryEntry): boolean => {
    if (student.beltHistory.length === 0) return false;
    return student.beltHistory[0]!.id === entry.id;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDeleteEntry) return;
    setDeletePending(true);
    setDeleteError(undefined);
    const result = await onDeleteEntry(deleteTarget.id);
    setDeletePending(false);
    if (result.success) {
      setDeleteTarget(null);
    } else {
      setDeleteError(result.error ?? "מחיקה נכשלה");
    }
  };

  const handleDeleteDialogOpenChange = (next: boolean) => {
    if (!next && deletePending) return;
    if (!next) {
      setDeleteTarget(null);
      setDeleteError(undefined);
    }
  };

  return (
    <>
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
                <h2 className="text-2xl font-bold text-foreground">
                  {student.name}
                </h2>
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
                      <span className="text-foreground">
                        מרכז: {student.centerName}
                      </span>
                    </div>
                  )}
                  {student.groupName && (
                    <div className="flex gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        קבוצה: {student.groupName}
                      </span>
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
                      <p className="text-foreground font-medium">
                        {student.currentBeltName}
                      </p>
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
                        {onDeleteEntry ? (
                          <TableHead
                            className="w-[60px] text-right text-muted-foreground"
                            aria-label="פעולות"
                          />
                        ) : null}
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
                          {onDeleteEntry ? (
                            <TableCell className="w-[60px]">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                aria-label={`מחיקת רשומת דרגה ${entry.beltName} מתאריך ${entry.promotionDate}`}
                                onClick={() => {
                                  setDeleteError(undefined);
                                  setDeleteTarget(entry);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          ) : null}
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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle>מחיקת רשומת דרגה</DialogTitle>
            <DialogDescription>
              {deleteTarget ? (
                <>
                  האם למחוק את הרשומה{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget.beltName}
                  </span>{" "}
                  מתאריך{" "}
                  <span dir="ltr" className="tabular-nums">
                    {deleteTarget.promotionDate}
                  </span>
                  ? פעולה זו אינה ניתנת לביטול.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && isLatestEntry(deleteTarget) ? (
            <p
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
              role="note"
            >
              מחיקת הרשומה עשויה לשנות את הדרגה הנוכחית של המתאמן.
            </p>
          ) : null}
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <div className="flex justify-start gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deletePending || !onDeleteEntry}
            >
              {deletePending ? (
                <>
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                "מחיקה"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDeleteDialogOpenChange(false)}
              disabled={deletePending}
            >
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

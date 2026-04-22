"use client";

import { useEffect, useRef, useState } from "react";
import { Award, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteBeltHistory } from "@/server/actions/delete-belt-history";

export type BeltHistoryReadOnlyEntry = {
  id: string;
  beltName: string;
  promotionDate: string;
  createdAt: string;
  certificateNumber: string | null;
};

type Props = {
  beltHistory: BeltHistoryReadOnlyEntry[] | undefined;
  /** When true, card spans full width in a grid (view mode). */
  fullWidth?: boolean;
  /** When true, show per-row delete (student modal edit flow only). */
  allowDelete?: boolean;
  /** Required when `allowDelete` is true. */
  studentId?: string;
  /** Called after successful delete so parent can refetch modal student. */
  onAfterDeleteSuccess?: () => void | Promise<void>;
};

/**
 * Belt history table for student details. Read-only by default; optional
 * per-row delete with confirmation (student modal edit mode).
 */
export function StudentBeltHistoryReadOnly({
  beltHistory,
  fullWidth = false,
  allowDelete = false,
  studentId,
  onAfterDeleteSuccess,
}: Props) {
  const [deleteTarget, setDeleteTarget] =
    useState<BeltHistoryReadOnlyEntry | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const closeAfterSuccessRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!allowDelete) {
      setDeleteTarget(null);
      setDeletePending(false);
      setDeleteSuccess(false);
      setDeleteError(undefined);
    }
  }, [allowDelete]);

  useEffect(() => {
    return () => {
      if (closeAfterSuccessRef.current != null) {
        clearTimeout(closeAfterSuccessRef.current);
      }
    };
  }, []);

  const isLatestEntry = (entry: BeltHistoryReadOnlyEntry): boolean => {
    if (!beltHistory?.length) return false;
    return beltHistory[0]!.id === entry.id;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !studentId) return;
    setDeletePending(true);
    setDeleteSuccess(false);
    setDeleteError(undefined);
    const result = await deleteBeltHistory(deleteTarget.id, studentId);
    if (result.success) {
      await onAfterDeleteSuccess?.();
      setDeletePending(false);
      setDeleteSuccess(true);
      if (closeAfterSuccessRef.current != null) {
        clearTimeout(closeAfterSuccessRef.current);
      }
      closeAfterSuccessRef.current = setTimeout(() => {
        closeAfterSuccessRef.current = null;
        setDeleteTarget(null);
        setDeleteSuccess(false);
        setDeleteError(undefined);
      }, 900);
    } else {
      setDeletePending(false);
      setDeleteSuccess(false);
      setDeleteError(result.error ?? "מחיקה נכשלה");
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && deletePending) return;
    if (!open) {
      if (closeAfterSuccessRef.current != null) {
        clearTimeout(closeAfterSuccessRef.current);
        closeAfterSuccessRef.current = null;
      }
      setDeleteTarget(null);
      setDeleteSuccess(false);
      setDeleteError(undefined);
    }
  };

  const deleteActionLabel = deletePending
    ? "מוחק..."
    : deleteSuccess
      ? "נמחק בהצלחה"
      : "מחיקה";

  const isDeleteActionDisabled =
    deletePending || deleteSuccess || !studentId;

  const showActions = allowDelete && !!studentId;

  return (
    <>
      <Card
        className={`border-border bg-card ${fullWidth ? "sm:col-span-2" : ""}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-foreground">
            <Award className="h-4 w-4" />
            היסטוריית דרגות
          </CardTitle>
        </CardHeader>
        <CardContent>
          {beltHistory && beltHistory.length > 0 ? (
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
                    מספר תעודה
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    תאריך עדכון
                  </TableHead>
                  {showActions ? (
                    <TableHead
                      className="w-[52px] text-right text-muted-foreground"
                      aria-label="פעולות"
                    />
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {beltHistory.map((entry) => (
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
                    <TableCell className="text-muted-foreground">
                      {entry.certificateNumber ?? "—"}
                    </TableCell>
                    <TableCell
                      dir="ltr"
                      className="text-muted-foreground tabular-nums text-sm"
                    >
                      {entry.createdAt}
                    </TableCell>
                    {showActions ? (
                      <TableCell className="w-[52px]">
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
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-400"
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
          {deleteSuccess ? (
            <p className="text-sm text-emerald-700" role="status">
              הרשומה נמחקה בהצלחה
            </p>
          ) : null}
          <div className="flex justify-start gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleteActionDisabled}
            >
              {deletePending ? (
                <>
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                  {deleteActionLabel}
                </>
              ) : (
                deleteActionLabel
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDeleteDialogOpenChange(false)}
              disabled={deletePending || deleteSuccess}
            >
              ביטול
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

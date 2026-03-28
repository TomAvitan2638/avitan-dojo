"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { InstructorDetailsClient } from "@/app/(dashboard)/dashboard/instructors/[id]/instructor-details-client";
import { InstructorEditForm } from "@/app/(dashboard)/dashboard/instructors/[id]/instructor-edit-form";
import { getInstructorForModal } from "@/server/actions/get-instructor-for-modal";
import type { InstructorModalPayload } from "@/server/actions/get-instructor-for-modal";

type Props = {
  instructorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEditMode?: boolean;
  onSaveSuccess?: () => void;
};

export function InstructorDetailsModal({
  instructorId,
  open,
  onOpenChange,
  initialEditMode = false,
  onSaveSuccess,
}: Props) {
  const [payload, setPayload] = useState<InstructorModalPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [editFormKey, setEditFormKey] = useState(0);
  const appliedInitialModeRef = useRef(false);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setLoadError(null);
    const r = await getInstructorForModal(id);
    setLoading(false);
    if (r.ok) {
      setPayload(r.data);
    } else {
      setLoadError(r.error);
      setPayload(null);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setPayload(null);
      setLoadError(null);
      setMode("view");
      appliedInitialModeRef.current = false;
      return;
    }
    if (instructorId) {
      appliedInitialModeRef.current = false;
      void load(instructorId);
    }
  }, [open, instructorId, load]);

  useEffect(() => {
    if (!open || !payload || appliedInitialModeRef.current) return;
    appliedInitialModeRef.current = true;
    setMode(initialEditMode ? "edit" : "view");
    setEditFormKey((k) => k + 1);
  }, [open, payload, initialEditMode]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPayload(null);
      setLoadError(null);
      setMode("view");
      appliedInitialModeRef.current = false;
    }
    onOpenChange(next);
  };

  const handleEditSuccess = async () => {
    onSaveSuccess?.();
    if (instructorId) {
      await load(instructorId);
      setEditFormKey((k) => k + 1);
      setMode("view");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-2xl shadow-lg ring-1 ring-border/40"
        overlayClassName="bg-foreground/45 backdrop-blur-sm"
      >
        {loading && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
            role="status"
            aria-busy="true"
          >
            <Loader2 className="h-10 w-10 animate-spin text-dojo-red" />
            <p className="text-base">טוען פרטי מאמן...</p>
          </div>
        )}
        {loadError && !loading && (
          <div className="space-y-4 py-6">
            <p className="text-center text-destructive" role="alert">
              {loadError}
            </p>
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                סגור
              </Button>
            </div>
          </div>
        )}
        {payload && !loading && !loadError && mode === "view" && (
          <>
            <DialogHeader>
              <DialogTitle className="sr-only">
                {payload.instructor.name}
              </DialogTitle>
            </DialogHeader>
            <InstructorDetailsClient
              instructor={payload.instructor}
              groups={payload.groups}
              centers={payload.centers}
              onEditClick={() => setMode("edit")}
            />
            <div className="mt-2 flex justify-start gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                סגור
              </Button>
            </div>
          </>
        )}
        {payload && !loading && !loadError && mode === "edit" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              עריכת מאמן: {payload.instructor.name}
            </h2>
            <InstructorEditForm
              key={editFormKey}
              instructor={payload.edit.instructor}
              hideNavigation
              onSuccess={handleEditSuccess}
              onCancel={() => setMode("view")}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

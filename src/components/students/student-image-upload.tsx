"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_MB = 5;

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

function isValidFile(file: File): { valid: boolean; error?: string } {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: "סוג קובץ לא נתמך. השתמש ב-JPG, PNG או WebP",
    };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "סוג קובץ לא נתמך. השתמש ב-JPG, PNG או WebP",
    };
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      valid: false,
      error: `גודל הקובץ חורג מ-${MAX_SIZE_MB}MB`,
    };
  }
  return { valid: true };
}

type Props = {
  currentPhotoUrl?: string | null;
};

export function StudentImageUpload({ currentPhotoUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  const displayUrl = previewUrl ?? (cleared ? null : currentPhotoUrl ?? null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreviewUrl(null);
    setCleared(false);

    const file = e.target.files?.[0];
    if (!file) return;

    const result = isValidFile(file);
    if (!result.valid) {
      setError(result.error ?? "קובץ לא תקין");
      e.target.value = "";
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setError(null);
    setCleared(true);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-2">
      <Label>תמונת תלמיד</Label>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-3">
          <Avatar className="h-20 w-20 border-2 border-border">
            {displayUrl ? (
              <AvatarImage
                src={displayUrl}
                alt="תצוגה מקדימה"
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-dojo-red/10 text-2xl text-dojo-red">
                <User className="h-8 w-8" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-1">
            <input
              ref={inputRef}
              type="file"
              name="photo"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleChange}
              className="text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-dojo-red/10 file:px-3 file:py-1 file:text-sm file:text-dojo-red file:hover:bg-dojo-red/20"
            />
            {(displayUrl || previewUrl) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-right text-xs text-muted-foreground underline hover:text-foreground"
              >
                הסר תמונה
              </button>
            )}
          </div>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        JPG, JPEG, PNG או WebP. עד {MAX_SIZE_MB}MB.
      </p>
      {!previewUrl && (
        <input
          type="hidden"
          name="photoUrl"
          value={cleared ? "" : currentPhotoUrl ?? ""}
        />
      )}
    </div>
  );
}

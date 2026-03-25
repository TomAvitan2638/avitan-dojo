import { createSupabaseAdmin } from "@/lib/supabase";

const BUCKET = "student-photos";
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i >= 0 ? filename.slice(i).toLowerCase() : "";
}

function getMimeExt(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  return map[mime] ?? ".jpg";
}

async function fileToBuffer(file: File | Blob): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function uploadStudentPhoto(
  file: File,
  studentId?: string
): Promise<string> {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_TYPES.includes(file.type)) {
    throw new Error("סוג קובץ לא נתמך. השתמש ב-JPG, PNG או WebP");
  }

  const supabase = createSupabaseAdmin();
  const safeExt = getMimeExt(file.type);
  const timestamp = Date.now();
  const path = studentId
    ? `students/${studentId}-${timestamp}${safeExt}`
    : `new-${crypto.randomUUID()}${safeExt}`;

  const buffer = await fileToBuffer(file);

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw new Error(`שגיאה בהעלאת התמונה: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

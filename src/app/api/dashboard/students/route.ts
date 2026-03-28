import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getStudentsPagePayload } from "@/server/data/get-students-page-payload";

/**
 * Authenticated read of the Students tab payload (same data as RSC page).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getStudentsPagePayload(user);
  return NextResponse.json(payload);
}

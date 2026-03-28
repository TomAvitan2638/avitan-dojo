import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getInstructorsPagePayload } from "@/server/data/get-instructors-page-payload";

/** Authenticated read of the Instructors tab list (same data as former RSC load). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getInstructorsPagePayload(user);
  return NextResponse.json(payload);
}

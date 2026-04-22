import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getInstructorPaymentsPanelPayload } from "@/server/data/get-instructor-payments-panel-payload";

/** Admin-only: active instructors + instructor payment rows for the payments panel. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getInstructorPaymentsPanelPayload(user);
  if (!payload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(payload);
}

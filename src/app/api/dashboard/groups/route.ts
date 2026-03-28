import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getGroupsPagePayload } from "@/server/data/get-groups-page-payload";

/** Authenticated read of the Groups tab payload (same data as former RSC load). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getGroupsPagePayload(user);
  return NextResponse.json(payload);
}

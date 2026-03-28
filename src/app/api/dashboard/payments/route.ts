import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPaymentsPagePayload } from "@/server/data/get-payments-page-payload";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const search = (searchParams.get("search") ?? "").trim();
  const filterType = searchParams.get("filterType") ?? "";
  const filterSubtype = searchParams.get("filterSubtype") ?? "";

  const payload = await getPaymentsPagePayload(user, {
    page,
    search,
    filterType,
    filterSubtype,
  });
  return NextResponse.json(payload);
}

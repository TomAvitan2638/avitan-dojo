import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { getInstructorsPageScope } from "@/lib/instructors-page-scope";
import { InstructorsPageClient } from "./instructors-page-client";

export const dynamic = "force-dynamic";

export default async function InstructorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const queryScope = getInstructorsPageScope(user);

  return (
    <div className="min-h-screen">
      <Header title="מאמנים" />
      <div className="p-6">
        <InstructorsPageClient queryScope={queryScope} />
      </div>
    </div>
  );
}

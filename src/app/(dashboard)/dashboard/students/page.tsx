import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { getStudentsPageScope } from "@/lib/students-page-scope";
import { StudentsPageClient } from "./students-page-client";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const queryScope = getStudentsPageScope(user);

  return (
    <div className="min-h-screen">
      <Header title="תלמידים" />
      <div className="p-6">
        <StudentsPageClient queryScope={queryScope} />
      </div>
    </div>
  );
}

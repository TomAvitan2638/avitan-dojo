import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { getGroupsPageScope } from "@/lib/groups-page-scope";
import { GroupsPageClient } from "./groups-page-client";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const queryScope = getGroupsPageScope(user);

  return (
    <div className="min-h-screen">
      <Header title="קבוצות" />
      <div className="p-6">
        <GroupsPageClient queryScope={queryScope} />
      </div>
    </div>
  );
}

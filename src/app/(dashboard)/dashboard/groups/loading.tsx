import { Header } from "@/components/dashboard/header";
import { GroupsListLoadingBody } from "@/components/dashboard/dashboard-loading-skeleton";

export default function GroupsLoading() {
  return (
    <div className="min-h-screen">
      <Header title="קבוצות" />
      <div className="p-6">
        <GroupsListLoadingBody />
      </div>
    </div>
  );
}

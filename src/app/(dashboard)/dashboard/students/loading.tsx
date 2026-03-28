import { Header } from "@/components/dashboard/header";
import { StudentsListLoadingBody } from "@/components/dashboard/dashboard-loading-skeleton";

export default function StudentsLoading() {
  return (
    <div className="min-h-screen">
      <Header title="תלמידים" />
      <div className="p-6">
        <StudentsListLoadingBody />
      </div>
    </div>
  );
}

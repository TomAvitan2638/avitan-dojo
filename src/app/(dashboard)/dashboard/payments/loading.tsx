import { Header } from "@/components/dashboard/header";
import { PaymentsListLoadingBody } from "@/components/dashboard/dashboard-loading-skeleton";

export default function PaymentsLoading() {
  return (
    <div className="min-h-screen">
      <Header title="תשלומים" />
      <div className="p-6">
        <PaymentsListLoadingBody />
      </div>
    </div>
  );
}

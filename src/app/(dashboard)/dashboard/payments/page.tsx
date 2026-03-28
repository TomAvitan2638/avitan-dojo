import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { getPaymentsPageScope } from "@/lib/payments-page-scope";
import { PaymentsPageClient } from "./payments-page-client";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const queryScope = getPaymentsPageScope(user);

  return (
    <div className="min-h-screen">
      <Header title="תשלומים" />
      <div className="p-6">
        <PaymentsPageClient queryScope={queryScope} />
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { RecordPaymentForm } from "@/components/payments/RecordPaymentForm";
import { Header } from "@/components/dashboard/header";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ membershipId?: string; studentId?: string }>;
};

export default async function RecordPaymentPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  const membershipId = params.membershipId;
  const studentId = params.studentId;

  if (!membershipId || !studentId) {
    redirect("/dashboard");
  }

  const membership = await prisma.studentMembership.findFirst({
    where: {
      id: membershipId,
      studentId,
      ...(user.role === "INSTRUCTOR" && user.instructorId
        ? { group: { instructorId: user.instructorId } }
        : {}),
    },
    include: { student: true, group: true },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const studentName = `${membership.student.firstName} ${membership.student.lastName}`;

  return (
    <div className="min-h-screen">
      <Header title="רישום תשלום" />
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← חזרה לדשבורד
          </Link>
        </div>
        <div className="max-w-md">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <RecordPaymentForm
              membershipId={membershipId}
              studentId={studentId}
              studentName={studentName}
              groupName={membership.group.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

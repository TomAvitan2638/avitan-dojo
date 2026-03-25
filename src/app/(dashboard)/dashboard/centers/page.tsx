import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CentersPageClient } from "./centers-page-client";

export const dynamic = "force-dynamic";

export default async function CentersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [centers, instructors] = await Promise.all([
    prisma.center.findMany({
      include: {
        instructor: true,
        _count: { select: { groups: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.instructor.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const centersForList = centers.map((c) => ({
    id: c.id,
    name: c.name,
    instructorName: c.instructor
      ? `${c.instructor.firstName} ${c.instructor.lastName}`
      : null,
    price: c.price ? Number(c.price) : null,
    notes: c.notes ?? null,
    groupsCount: c._count.groups,
  }));

  const instructorsForSelect = instructors.map((i) => ({
    id: i.id,
    name: `${i.firstName} ${i.lastName}`,
  }));

  return (
    <div className="min-h-screen">
      <Header title="מרכזים" />
      <div className="p-6">
        <CentersPageClient
          centers={centersForList}
          instructors={instructorsForSelect}
        />
      </div>
    </div>
  );
}

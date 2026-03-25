"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  Users,
  Building2,
  Pencil,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";

type InstructorData = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  birthDate: string | null;
  notes: string | null;
  photoUrl: string | null;
  isActive: boolean;
};

type GroupInfo = {
  id: string;
  name: string;
  centerName: string;
};

type CenterInfo = {
  id: string;
  name: string;
};

type Props = {
  instructor: InstructorData;
  groups: GroupInfo[];
  centers: CenterInfo[];
};

export function InstructorDetailsClient({
  instructor,
  groups,
  centers,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-4 border-dojo-red/20">
            {instructor.photoUrl ? (
              <AvatarImage
                src={instructor.photoUrl}
                alt={instructor.name}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-dojo-red/10 text-xl text-dojo-red">
                {instructor.lastName?.charAt(0) ?? "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {instructor.name}
            </h2>
            <Badge
              variant="outline"
              className={
                instructor.isActive
                  ? "mt-2 border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                  : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"
              }
            >
              {instructor.isActive ? "פעיל" : "לא פעיל"}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/instructors/${instructor.id}/edit`}>
            <Pencil className="ml-1 h-4 w-4" />
            עריכה
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">פרטים אישיים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {instructor.birthDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>תאריך לידה: {instructor.birthDate}</span>
              </div>
            )}
            {instructor.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{instructor.notes}</span>
              </div>
            )}
            {!instructor.birthDate && !instructor.notes && (
              <p className="text-sm text-muted-foreground">אין פרטים נוספים</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="text-lg">פרטי התקשרות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {instructor.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{instructor.phone}</span>
              </div>
            )}
            {instructor.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{instructor.email}</span>
              </div>
            )}
            {instructor.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {instructor.address
                    ? `${instructor.address}, ${instructor.city}`
                    : instructor.city}
                </span>
              </div>
            )}
            {!instructor.phone &&
              !instructor.email &&
              !instructor.city && (
                <p className="text-sm text-muted-foreground">
                  אין פרטי התקשרות
                </p>
              )}
          </CardContent>
        </Card>
      </div>

      {groups.length > 0 && (
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              קבוצות ({groups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                >
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {group.centerName}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {centers.length > 0 && (
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              מרכזים ({centers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {centers.map((center) => (
                <li
                  key={center.id}
                  className="rounded-lg bg-secondary/50 p-3 font-medium"
                >
                  {center.name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {groups.length === 0 && centers.length === 0 && (
        <Card className="border-border/50 bg-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            אין קבוצות או מרכזים משויכים
          </CardContent>
        </Card>
      )}
    </div>
  );
}

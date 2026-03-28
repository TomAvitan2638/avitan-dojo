"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Award, User, ChevronRight, ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BeltHistoryModal,
  type StudentForBeltModal,
} from "@/components/belts/belt-history-modal";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type StudentRow = {
  id: string;
  identifier: string;
  firstName: string;
  lastName: string;
  name: string;
  photoUrl: string | null;
  centerName: string | null;
  groupName: string | null;
  currentBeltName: string | null;
  currentBeltOrder: number | null;
  currentBeltDate: string | null;
  currentBeltDateRaw: Date | null;
  beltHistory: {
    id: string;
    beltName: string;
    beltOrder: number;
    promotionDate: string;
    promotionDateRaw: Date;
    createdAt: string;
    createdAtRaw: Date;
  }[];
};

type Props = {
  students: StudentRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

type SortColumn =
  | "name"
  | "identifier"
  | "centerName"
  | "groupName"
  | "currentBelt"
  | "currentBeltDate";
type SortDirection = "asc" | "desc";

function normalizeForSearch(s: string | null | undefined): string {
  return (s ?? "").toString().toLowerCase().trim();
}

function matchesSearch(student: StudentRow, query: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return true;
  const fields = [
    student.name,
    student.identifier,
    student.centerName,
    student.groupName,
    student.currentBeltName,
  ];
  return fields.some((f) => normalizeForSearch(f).includes(q));
}

export function BeltsPageClient({
  students,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [modalStudent, setModalStudent] = useState<StudentForBeltModal | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  const filteredAndSortedStudents = useMemo(() => {
    const filtered = students.filter((s) => matchesSearch(s, searchQuery));
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "name":
          cmp = (a.name ?? "").localeCompare(b.name ?? "");
          break;
        case "identifier":
          cmp = (a.identifier ?? "").localeCompare(b.identifier ?? "");
          break;
        case "centerName":
          cmp = (a.centerName ?? "").localeCompare(b.centerName ?? "");
          break;
        case "groupName":
          cmp = (a.groupName ?? "").localeCompare(b.groupName ?? "");
          break;
        case "currentBelt":
          cmp = (a.currentBeltOrder ?? -1) - (b.currentBeltOrder ?? -1);
          break;
        case "currentBeltDate": {
          const ta = a.currentBeltDateRaw?.getTime() ?? 0;
          const tb = b.currentBeltDateRaw?.getTime() ?? 0;
          cmp = ta - tb;
          break;
        }
        default:
          cmp = 0;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [students, searchQuery, sortColumn, sortDirection]);

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const handleRowClick = (student: StudentRow) => {
    setModalStudent({
      id: student.id,
      name: student.name,
      identifier: student.identifier,
      photoUrl: student.photoUrl,
      centerName: student.centerName,
      groupName: student.groupName,
      currentBeltName: student.currentBeltName,
      currentBeltDate: student.currentBeltDate,
      beltHistory: student.beltHistory,
    });
    setModalOpen(true);
  };

  const cellClass = "py-3.5 px-4 text-[15px] align-middle text-right";
  const headerClass =
    "py-3.5 px-4 text-[15px] font-medium text-muted-foreground align-middle text-right";

  const SortHeader = ({
    column,
    label,
  }: {
    column: SortColumn;
    label: string;
  }) => (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/30 transition-colors duration-150 ${headerClass}`}
      onClick={() => handleSort(column)}
    >
      {label}
      {sortColumn === column ? (
        <span className="ms-1.5 text-muted-foreground/70 text-xs">
          {sortDirection === "asc" ? "↑" : "↓"}
        </span>
      ) : null}
    </TableHead>
  );

  return (
    <>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש דרגות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary pr-10"
          />
        </div>
      </div>

      <div className="mt-1">
        {filteredAndSortedStudents.length === 0 ? (
          <Card className="rounded-lg border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="h-16 w-16 text-muted-foreground/30" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {totalCount === 0
                  ? "אין תלמידים במערכת"
                  : "אין תלמידים התואמים את החיפוש"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                {totalCount === 0
                  ? "הוסף תלמידים במערכת התלמידים"
                  : "נסה לשנות את מילות החיפוש"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-lg border-border/50 bg-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead
                      className="w-[52px] min-w-[52px] max-w-[52px] py-3.5 px-2 text-right align-middle"
                      aria-hidden
                    />
                    <SortHeader column="name" label="שם מלא" />
                    <SortHeader column="identifier" label="ת״ז" />
                    <SortHeader column="centerName" label="מרכז" />
                    <SortHeader column="groupName" label="קבוצה" />
                    <SortHeader column="currentBelt" label="דרגה נוכחית" />
                    <SortHeader column="currentBeltDate" label="תאריך דרגה נוכחית" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer border-b border-border/50 transition-colors duration-150 hover:bg-muted/40"
                      onClick={() => handleRowClick(student)}
                    >
                      <TableCell
                        className="w-[52px] min-w-[52px] max-w-[52px] py-3.5 px-2 text-right align-middle"
                        title={student.name}
                      >
                        <div className="flex justify-center">
                          <Avatar className="h-8 w-8 shrink-0">
                            {student.photoUrl ? (
                              <AvatarImage
                                src={student.photoUrl}
                                alt={student.name}
                                className="object-cover"
                              />
                            ) : (
                              <AvatarFallback className="bg-muted text-muted-foreground">
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell
                        className={`max-w-[220px] truncate font-semibold ${cellClass}`}
                        title={student.name}
                      >
                        {student.name}
                      </TableCell>
                      <TableCell
                        dir="ltr"
                        className={`min-w-[180px] font-medium tabular-nums whitespace-nowrap ${cellClass}`}
                        title={student.identifier}
                      >
                        {student.identifier}
                      </TableCell>
                      <TableCell
                        className={`max-w-[140px] truncate text-muted-foreground ${cellClass}`}
                        title={student.centerName ?? "-"}
                      >
                        {student.centerName ?? "-"}
                      </TableCell>
                      <TableCell
                        className={`max-w-[140px] truncate text-muted-foreground ${cellClass}`}
                        title={student.groupName ?? "-"}
                      >
                        {student.groupName ?? "-"}
                      </TableCell>
                      <TableCell
                        className={`max-w-[140px] truncate ${cellClass}`}
                        title={student.currentBeltName ?? "-"}
                      >
                        {student.currentBeltName ?? "-"}
                      </TableCell>
                      <TableCell
                        dir="ltr"
                        className={`min-w-[95px] tabular-nums text-muted-foreground ${cellClass}`}
                      >
                        {student.currentBeltDate ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-row-reverse items-center justify-between gap-4 border-t border-border/50 pt-4">
          <div className="text-sm text-muted-foreground">
            עמוד {currentPage} מתוך {totalPages}
            <span className="me-2 ms-2">•</span>
            {totalCount} תלמידים
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              asChild={currentPage > 1}
            >
              {currentPage > 1 ? (
                <Link href={`/dashboard/belts?page=${currentPage - 1}`}>
                  <ChevronRight className="ml-1 h-4 w-4" />
                  הקודם
                </Link>
              ) : (
                <>
                  <ChevronRight className="ml-1 h-4 w-4" />
                  הקודם
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              asChild={currentPage < totalPages}
            >
              {currentPage < totalPages ? (
                <Link href={`/dashboard/belts?page=${currentPage + 1}`}>
                  הבא
                  <ChevronLeft className="mr-1 h-4 w-4" />
                </Link>
              ) : (
                <>
                  הבא
                  <ChevronLeft className="mr-1 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <BeltHistoryModal
        student={modalStudent}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

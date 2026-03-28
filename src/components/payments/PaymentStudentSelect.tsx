"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Lucide from "lucide-react";

const ChevronDown = (Lucide as Record<string, React.ComponentType<{ className?: string }>>)
  .ChevronDown;
import { cn } from "@/lib/utils";
import type { StudentOption } from "@/server/actions/get-students-for-payment-selector";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function studentMatches(s: StudentOption, q: string): boolean {
  const n = normalize(q);
  if (!n) return true;
  const idCompact = normalize(s.identifier).replace(/\s/g, "");
  const queryId = n.replace(/\s/g, "");
  const fn = normalize(s.firstName);
  const ln = normalize(s.lastName);
  const full = `${fn} ${ln}`.replace(/\s+/g, " ");
  const nameCombined = normalize(s.name).replace(/\s+/g, " ");
  return (
    fn.includes(n) ||
    ln.includes(n) ||
    full.includes(n) ||
    nameCombined.includes(n) ||
    idCompact.includes(queryId)
  );
}

function formatOptionLabel(s: StudentOption): string {
  const base = `${s.name} (${s.identifier})`;
  const extras: string[] = [];
  if (s.centerName) extras.push(s.centerName);
  if (s.groupName) extras.push(s.groupName);
  if (extras.length) return `${base} - ${extras.join(" · ")}`;
  return base;
}

type Props = {
  students: StudentOption[];
  loading: boolean;
  disabled?: boolean;
  /** When this value changes, selection and search reset */
  resetKey?: string | number;
  id?: string;
  /** Applied when present and the student exists in `students` (e.g. after async load) */
  initialStudentId?: string | null;
};

export function PaymentStudentSelect({
  students,
  loading,
  disabled,
  resetKey,
  id = "studentId",
  initialStudentId = null,
}: Props) {
  const triggerId = `${id}-trigger`;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => students.filter((s) => studentMatches(s, query)),
    [students, query]
  );

  useEffect(() => {
    setSelectedId("");
    setQuery("");
    setOpen(false);
    setHighlighted(0);
  }, [resetKey]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && !loading) {
      searchRef.current?.focus();
      setHighlighted(0);
    }
  }, [open, loading]);

  useEffect(() => {
    if (highlighted >= filtered.length) {
      setHighlighted(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, highlighted]);

  useEffect(() => {
    if (!initialStudentId || loading) return;
    if (students.some((s) => s.id === initialStudentId)) {
      setSelectedId(initialStudentId);
    }
  }, [initialStudentId, loading, students]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedId),
    [students, selectedId]
  );

  const selectDisabled = disabled || loading;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(filtered.length - 1, h + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      const s = filtered[highlighted];
      if (s) {
        setSelectedId(s.id);
        setOpen(false);
        setQuery("");
      }
    }
  };

  const displayLabel = selectedStudent ? formatOptionLabel(selectedStudent) : "";

  return (
    <div ref={containerRef} className="relative" dir="rtl">
      <select
        name="studentId"
        required
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        disabled={selectDisabled}
      >
        <option value="">בחר תלמיד</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {formatOptionLabel(s)}
          </option>
        ))}
      </select>

      <button
        type="button"
        id={triggerId}
        disabled={selectDisabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        onClick={() => !selectDisabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (selectDisabled) return;
          if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
            e.preventDefault();
            setOpen(true);
          }
          if (e.key === "Escape" && open) {
            e.preventDefault();
            setOpen(false);
          }
        }}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-base text-foreground shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          selectDisabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-right",
            !selectedStudent && "text-muted-foreground"
          )}
        >
          {loading ? "טוען תלמידים..." : selectedStudent ? displayLabel : "בחר תלמיד"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-70 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && !loading && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-label="רשימת תלמידים"
          className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="חיפוש לפי שם או ת״ז..."
              className={cn(
                "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-base text-foreground shadow-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              dir="rtl"
              autoComplete="off"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-base text-muted-foreground">לא נמצאו תוצאות</li>
            ) : (
              filtered.map((s, idx) => (
                <li key={s.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedId === s.id}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-3 py-2 text-right text-base text-foreground transition-colors hover:bg-muted/60",
                      highlighted === idx && "bg-muted/60",
                      selectedId === s.id && "font-medium"
                    )}
                    onMouseEnter={() => setHighlighted(idx)}
                    onClick={() => {
                      setSelectedId(s.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {formatOptionLabel(s)}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

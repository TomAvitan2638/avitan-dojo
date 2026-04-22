"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { fetchMonthlyIncomeForYear } from "@/server/actions/fetch-monthly-income-for-year";
import type { MonthlyIncomeMonthRow } from "@/server/services/dashboard-service";
import { cn } from "@/lib/utils";

function formatCurrencyIls(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function buildYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const minYear = Math.max(2000, currentYear - 25);
  const years: number[] = [];
  for (let y = currentYear; y >= minYear; y--) {
    years.push(y);
  }
  return years;
}

/** Upper bound for the Y-axis: padded above max data, rounded to a readable step (not misleading). */
function computeDomainMax(maxVal: number): number {
  if (maxVal <= 0) return 1;
  const padded = maxVal * 1.12;
  const exp = Math.floor(Math.log10(padded));
  const pow = 10 ** exp;
  const n = padded / pow;
  let nice: number;
  if (n <= 1) nice = 1;
  else if (n <= 2) nice = 2;
  else if (n <= 5) nice = 5;
  else nice = 10;
  return nice * pow;
}

function formatAxisAmount(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}מ׳`;
  if (n >= 1000) return `${Math.round(n / 100) / 10}א׳`;
  return String(Math.round(n));
}

type LineTooltipState = {
  label: string;
  studentTotal: number;
  coachTotal: number;
  total: number;
  /** X of point center relative to chart area (px), for absolute positioning. */
  anchorLeft: number;
  /** Y of point center relative to chart area (px), for absolute positioning. */
  anchorTop: number;
};

const GRID_DIVISIONS = 6;

/**
 * SVG user space → viewport (client) pixels, including letterboxing from
 * preserveAspectRatio — required for correct tooltip placement over points.
 */
function svgUserPointToClient(
  svg: SVGSVGElement,
  svgX: number,
  svgY: number
): { x: number; y: number } | null {
  const pt = svg.createSVGPoint();
  pt.x = svgX;
  pt.y = svgY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return null;
  const p = pt.matrixTransform(ctm);
  return { x: p.x, y: p.y };
}

function buildLinePath(
  pts: { x: number; y: number }[]
): string {
  if (pts.length === 0) return "";
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");
}

function MonthlyIncomeLineChart({ rows }: { rows: MonthlyIncomeMonthRow[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const maxData = useMemo(
    () =>
      Math.max(
        0,
        ...rows.flatMap((r) => [r.studentTotal, r.coachTotal])
      ),
    [rows]
  );
  const domainMax = useMemo(() => computeDomainMax(maxData), [maxData]);
  const [tooltip, setTooltip] = useState<LineTooltipState | null>(null);

  const W = 760;
  const H = 360;
  const padL = 54;
  const padR = 16;
  const padT = 22;
  const padB = 64;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const slotW = plotW / 12;

  const yFor = (value: number) =>
    padT +
    plotH -
    (domainMax > 0 ? (value / domainMax) * plotH : 0);

  const yTicks = useMemo(
    () =>
      Array.from(
        { length: GRID_DIVISIONS + 1 },
        (_, i) => (domainMax * i) / GRID_DIVISIONS
      ),
    [domainMax]
  );

  const studentPoints = useMemo(() => {
    return rows.map((row, i) => {
      const x = padL + i * slotW + slotW / 2;
      return { x, y: yFor(row.studentTotal), row };
    });
  }, [rows, domainMax, plotH, padT, slotW, padL]);

  const coachPoints = useMemo(() => {
    return rows.map((row, i) => {
      const x = padL + i * slotW + slotW / 2;
      return { x, y: yFor(row.coachTotal), row };
    });
  }, [rows, domainMax, plotH, padT, slotW, padL]);

  const lineStudentD = useMemo(
    () =>
      buildLinePath(
        studentPoints.map((p) => ({ x: p.x, y: p.y }))
      ),
    [studentPoints]
  );
  const lineCoachD = useMemo(
    () =>
      buildLinePath(coachPoints.map((p) => ({ x: p.x, y: p.y }))),
    [coachPoints]
  );

  const updateTooltipAtBand = (
    row: MonthlyIncomeMonthRow,
    svgX: number,
    svgY: number
  ) => {
    const svg = svgRef.current;
    const area = chartAreaRef.current;
    if (!svg || !area) return;
    const client = svgUserPointToClient(svg, svgX, svgY);
    if (!client) return;
    const br = area.getBoundingClientRect();
    let left = client.x - br.left;
    const top = client.y - br.top;
    const halfEst = 88;
    const edge = 8;
    const minX = halfEst + edge;
    const maxX = br.width - halfEst - edge;
    if (maxX >= minX) {
      left = Math.max(minX, Math.min(left, maxX));
    }
    setTooltip({
      label: row.label,
      studentTotal: row.studentTotal,
      coachTotal: row.coachTotal,
      total: row.total,
      anchorLeft: left,
      anchorTop: top,
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-300/45 bg-card bg-gradient-to-b from-[#fdfcfa] to-[#f7f4ee] p-5 shadow-sm ring-1 ring-stone-200/40 dark:from-card dark:to-card dark:ring-border/30">
      <p className="mb-3 text-center text-lg font-bold tracking-tight text-stone-900">
        סיכום חודשי
      </p>
      <div
        className="mb-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-stone-700"
        dir="rtl"
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-10 rounded-full bg-dojo-gold" />
          תלמידים
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-10 rounded-full bg-dojo-red" />
          מאמנים
        </span>
      </div>
      <div
        ref={chartAreaRef}
        className="relative min-h-[min(52vh,420px)]"
        dir="ltr"
      >
        <svg
          ref={svgRef}
          className="h-auto w-full max-w-full text-stone-400"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="תרשים קו הכנסות תלמידים ומאמנים לפי חודש"
        >
          {yTicks.map((tick, ti) => {
            const y = padT + plotH - (tick / domainMax) * plotH;
            const isEdge = ti === 0 || ti === yTicks.length - 1;
            return (
              <g key={`grid-${ti}`}>
                <line
                  x1={padL}
                  x2={W - padR}
                  y1={y}
                  y2={y}
                  className={
                    isEdge
                      ? "stroke-stone-300/90 dark:stroke-stone-600/65"
                      : "stroke-stone-200/95 dark:stroke-stone-700/45"
                  }
                  strokeWidth={isEdge ? 1 : 0.75}
                  strokeDasharray={isEdge ? undefined : "2 8"}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-stone-700 text-[11px] font-semibold tabular-nums sm:text-[12px]"
                >
                  {tick === 0 ? "0" : formatAxisAmount(tick)}
                </text>
              </g>
            );
          })}

          <path
            d={lineStudentD}
            fill="none"
            className="stroke-dojo-gold"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter:
                "drop-shadow(0 2px 4px rgba(180, 120, 40, 0.18))",
            }}
          />
          <path
            d={lineCoachD}
            fill="none"
            className="stroke-dojo-red"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(160, 40, 40, 0.15))",
            }}
          />

          {rows.map((row, i) => {
            const xCenter = padL + i * slotW + slotW / 2;
            const yMid =
              (studentPoints[i].y + coachPoints[i].y) / 2;
            return (
              <rect
                key={`hit-${row.monthIndex}`}
                x={padL + i * slotW}
                y={padT}
                width={slotW}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() =>
                  updateTooltipAtBand(row, xCenter, yMid)
                }
                onMouseMove={() =>
                  updateTooltipAtBand(row, xCenter, yMid)
                }
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}

          {studentPoints.map(({ x, y, row }) => (
            <circle
              key={`stu-${row.monthIndex}`}
              cx={x}
              cy={y}
              r={5}
              className="pointer-events-none fill-[#fdfcfa] stroke-dojo-gold"
              strokeWidth={2.5}
            />
          ))}
          {coachPoints.map(({ x, y, row }) => (
            <circle
              key={`coa-${row.monthIndex}`}
              cx={x}
              cy={y}
              r={5}
              className="pointer-events-none fill-[#fdfcfa] stroke-dojo-red"
              strokeWidth={2.5}
            />
          ))}

          {rows.map((row, i) => {
            const xCenter = padL + i * slotW + slotW / 2;
            return (
              <text
                key={`lbl-${row.monthIndex}`}
                x={xCenter}
                y={H - 12}
                textAnchor="middle"
                className="fill-stone-700 text-[10px] font-bold sm:text-[11.5px]"
              >
                {row.label}
              </text>
            );
          })}
        </svg>

        {tooltip ? (
          <div
            className="pointer-events-none absolute z-20 w-max max-w-[min(92vw,16rem)] rounded-xl border border-stone-300/60 bg-[#fdfcfa] px-3.5 py-2.5 text-sm shadow-md ring-1 ring-stone-200/50 dark:border-border dark:bg-card dark:ring-border/40"
            style={{
              left: tooltip.anchorLeft,
              top: tooltip.anchorTop,
              transform: "translate(-50%, calc(-100% - 10px))",
            }}
            role="tooltip"
          >
            <div
              className="text-center text-[15px] font-bold text-stone-900"
              dir="rtl"
            >
              {tooltip.label}
            </div>
            <div
              className="mt-2 space-y-1 text-[13px] text-stone-700"
              dir="rtl"
            >
              <div className="flex justify-between gap-6">
                <span>תלמידים</span>
                <span className="font-semibold tabular-nums" dir="ltr">
                  {formatCurrencyIls(tooltip.studentTotal)}
                </span>
              </div>
              <div className="flex justify-between gap-6">
                <span>מאמנים</span>
                <span className="font-semibold tabular-nums" dir="ltr">
                  {formatCurrencyIls(tooltip.coachTotal)}
                </span>
              </div>
              <div className="flex justify-between gap-6 border-t border-stone-200 pt-1.5 font-bold dark:border-border">
                <span>סה״כ</span>
                <span className="tabular-nums" dir="ltr">
                  {formatCurrencyIls(tooltip.total)}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MonthlyIncomeHistoryModal({ open, onOpenChange }: Props) {
  const yearOptions = buildYearOptions();
  const [year, setYear] = useState(
    () => yearOptions[0] ?? new Date().getFullYear()
  );
  const [rows, setRows] = useState<MonthlyIncomeMonthRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (y: number) => {
    setLoading(true);
    setError(null);
    const result = await fetchMonthlyIncomeForYear(y);
    setLoading(false);
    if (result.ok) {
      setRows(result.data.months);
    } else {
      setRows(null);
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load(year);
  }, [open, year, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] w-[min(96vw,56rem)] max-w-[min(96vw,56rem)] gap-0 overflow-y-auto border-border bg-card p-6 sm:p-8 sm:max-w-[56rem]"
        dir="rtl"
      >
        <DialogHeader className="space-y-1 pb-2 text-right">
          <DialogTitle className="text-2xl font-bold tracking-tight text-stone-900 sm:text-[1.65rem]">
            הכנסות לפי חודש
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="grid gap-3 rounded-2xl border border-stone-200/80 bg-[#fdfcfa] p-4 shadow-sm dark:border-border/60 dark:bg-muted/20">
            <Label
              htmlFor="income-history-year"
              className="text-lg font-bold text-stone-900"
            >
              שנה
            </Label>
            <select
              id="income-history-year"
              className={cn(
                // Physical pr-* so RTL doesn’t put padding on the wrong side — year + chevron both sit on the right; reserve space for the arrow.
                "min-h-[3.25rem] w-full appearance-none rounded-xl border-2 border-stone-300/90 bg-[#fffefb] py-3 pl-4 pr-14 text-lg font-semibold text-stone-950 shadow-sm",
                "transition-[border-color,box-shadow] hover:border-stone-400/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dojo-red/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fdfcfa]",
                "dark:border-border dark:bg-card dark:text-stone-900 dark:focus-visible:ring-offset-card",
                "disabled:cursor-not-allowed disabled:opacity-55"
              )}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%233d3d3d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 1rem center",
                backgroundSize: "1.15rem",
              }}
              value={year}
              disabled={loading}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div
              className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-4 text-sm text-stone-600"
              role="status"
              aria-busy="true"
            >
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
              טוען נתונים...
            </div>
          ) : error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : rows ? (
            <div className="space-y-6">
              <MonthlyIncomeLineChart rows={rows} />
              <div className="overflow-x-auto rounded-xl border border-border/70 bg-[#fdfcfa] dark:bg-card">
                <div
                  className="grid min-w-[20rem] grid-cols-4 gap-3 border-b border-border/80 px-4 py-3 text-sm font-bold text-stone-900 sm:px-5"
                  dir="rtl"
                >
                  <span className="text-right">חודש</span>
                  <span className="text-end">תלמידים</span>
                  <span className="text-end">מאמנים</span>
                  <span className="text-end">סה״כ</span>
                </div>
                <ul className="divide-y divide-border/80">
                  {rows.map((row) => (
                    <li
                      key={row.monthIndex}
                      className="grid min-w-[20rem] grid-cols-4 gap-3 px-4 py-3.5 text-[16px] leading-snug sm:px-5 sm:py-4 sm:text-[17px]"
                      dir="rtl"
                    >
                      <span className="font-semibold text-stone-900">
                        {row.label}
                      </span>
                      <span
                        className="tabular-nums text-stone-700"
                        dir="ltr"
                      >
                        {formatCurrencyIls(row.studentTotal)}
                      </span>
                      <span
                        className="tabular-nums text-stone-700"
                        dir="ltr"
                      >
                        {formatCurrencyIls(row.coachTotal)}
                      </span>
                      <span
                        className="font-bold tabular-nums text-stone-900"
                        dir="ltr"
                      >
                        {formatCurrencyIls(row.total)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

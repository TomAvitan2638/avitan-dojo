import type { TrainingDay } from "@prisma/client";

export const TRAINING_DAY_LABELS: Record<TrainingDay, string> = {
  SUNDAY: "ראשון",
  MONDAY: "שני",
  TUESDAY: "שלישי",
  WEDNESDAY: "רביעי",
  THURSDAY: "חמישי",
  FRIDAY: "שישי",
  SATURDAY: "שבת",
};

export const TRAINING_DAYS_ORDER: TrainingDay[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function formatScheduleTime(date: Date): string {
  return date.toTimeString().slice(0, 5); // HH:mm
}

export function parseTimeToDate(value: string): Date {
  const [h, m] = value.split(":").map(Number);
  const d = new Date(2000, 0, 1, h ?? 0, m ?? 0, 0, 0);
  return d;
}

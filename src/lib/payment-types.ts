import type { PaymentType, MonthlyPaymentSubtype, PaymentMethod } from "@prisma/client";

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  MONTHLY: "חודשי",
  EQUIPMENT: "ציוד",
  EXAM: "מבחן",
};

export const MONTHLY_SUBTYPE_LABELS: Record<MonthlyPaymentSubtype, string> = {
  REGULAR: "תשלום רגיל",
  CHECK: "המחאה",
  WAIVER: "פטור מתשלום",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "מזומן",
  credit_card: "כרטיס אשראי",
  check: "המחאה",
  bank_transfer: "העברה בנקאית",
  bit: "ביט",
  paybox: "פייבוקס",
};

export const PAYMENT_METHODS_FOR_REGULAR: PaymentMethod[] = [
  "bit",
  "paybox",
  "cash",
  "bank_transfer",
];

export function getPaymentTypeLabel(type: PaymentType | null): string {
  if (!type) return "-";
  return PAYMENT_TYPE_LABELS[type];
}

export function getMonthlySubtypeLabel(subtype: MonthlyPaymentSubtype | null): string {
  if (!subtype) return "-";
  return MONTHLY_SUBTYPE_LABELS[subtype];
}

export function getPaymentMethodLabel(method: PaymentMethod | null): string {
  if (!method) return "-";
  return PAYMENT_METHOD_LABELS[method];
}

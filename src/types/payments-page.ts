import type { PaymentType, MonthlyPaymentSubtype, PaymentMethod } from "@prisma/client";

export type PaymentsPageQueryScope = {
  role: string;
  instructorId: string | null;
};

/** URL-driven list slice (pagination + filters). Part of the React Query key. */
export type PaymentsPageListParams = {
  page: number;
  search: string;
  filterType: string;
  filterSubtype: string;
};

export type PaymentListRow = {
  id: string;
  studentId: string;
  paymentType: PaymentType;
  monthlySubtype: MonthlyPaymentSubtype | null;
  paymentDate: string;
  paymentDateIso: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
  studentIdentifier: string;
  studentName: string;
  centerName: string | null;
  groupName: string | null;
  months: string[];
  equipmentItems: {
    code: string;
    quantity: number;
    unitAmountSnapshot: number | null;
  }[];
  equipmentNotes: string | null;
  examCode: string | null;
  examDate: string | null;
  examDateIso: string | null;
  bankNumber: string | null;
  checkNumber: string | null;
  waiverReason: string | null;
};

export type PaymentsSystemDataRow = {
  id: string;
  code: string;
  description: string;
  amount: number;
};

export type PaymentsPagePayload = {
  payments: PaymentListRow[];
  sportsEquipment: PaymentsSystemDataRow[];
  exams: PaymentsSystemDataRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

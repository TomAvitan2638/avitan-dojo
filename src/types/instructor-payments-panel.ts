export type InstructorOption = {
  id: string;
  firstName: string;
  lastName: string;
};

export type InstructorPaymentListRow = {
  id: string;
  instructorId: string;
  instructorName: string;
  amount: number;
  paymentDateIso: string;
  /** For edit prefills and logic. */
  coveredMonths: { year: number; month: number }[];
  /** Ordered covered months as display strings, e.g. "מרץ 2026". */
  coveredMonthLabels: string[];
  /** Joined display for tables. */
  coverageSummary: string;
  notes: string | null;
  createdAtIso: string;
};

export type InstructorPaymentPanelPayload = {
  activeInstructors: InstructorOption[];
  payments: InstructorPaymentListRow[];
};

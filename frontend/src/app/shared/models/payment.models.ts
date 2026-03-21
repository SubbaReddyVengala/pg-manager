export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
export type PaymentMode   = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

// ── Table row (Screenshot 1) ──────────────────────────────────────────
export interface PaymentResponse {
  id:            number;
  tenantId:      number;
  tenantName:    string;        // TENANT column
  roomId:        number;
  roomNumber:    string;        // ROOM column
  rentMonth:     string;        // ISO date e.g. '2026-03-01'
  rentAmount:    number;        // RENT AMOUNT column
  amountPaid:    number;
  balance:       number;        // remaining for PARTIAL
  paymentDate:   string | null; // PAID DATE column
  dueDate:       string | null; // DUE DATE column
  paymentMode:   PaymentMode | null; // MODE column
  transactionId: string | null; // TXN ID column
  note:          string | null;
  status:        PaymentStatus; // STATUS column
  receiptNumber: string | null;
  overdue:       boolean;       // red row highlight
}

// ── Record Payment form (Screenshot 2 drawer) ─────────────────────────
export interface PaymentRequest {
  tenantId:      number;
  rentMonth:     string;        // '2026-03-01'
  amountPaid:    number;
  paymentDate:   string;
  paymentMode:   PaymentMode;
  transactionId: string | null;
  note:          string | null;
}

// ── 4 Stat cards (Screenshot 1 top row) ──────────────────────────────
export interface PaymentStats {
  collected:       number;   // COLLECTED card
  collectedCount:  number;   // '1 Fully Paid'
  outstanding:     number;   // OUTSTANDING card
  overdueCount:    number;   // '1 Overdue'
  dueThisWeek:     number;   // DUE THIS WEEK card
  dueThisWeekCount:number;   // '1 on Due'
  depositsHeld:    number;   // DEPOSITS HELD card
  depositsCount:   number;   // '6 Tenants'
}

// ── Generate dues request ─────────────────────────────────────────────
export interface GenerateDuesRequest {
  month: string;  // '2026-03-01'
}

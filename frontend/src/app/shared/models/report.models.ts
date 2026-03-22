import { PaymentResponse } from './payment.models';

export interface MonthlyReport {
  month:            string;
  totalCollected:   number;
  totalOutstanding: number;
  totalRentDue:     number;
  totalTenants:     number;
  paidCount:        number;
  overdueCount:     number;
  partialCount:     number;
  pendingCount:     number;
  collectionRate:   number;
  payments:         PaymentResponse[];
}

export interface MonthSummary {
  monthLabel:   string;
  month:        string;
  collected:    number;
  outstanding:  number;
  tenantCount:  number;
}

export interface AnnualSummary {
  year:             number;
  totalCollected:   number;
  totalOutstanding: number;
  months:           MonthSummary[];
}

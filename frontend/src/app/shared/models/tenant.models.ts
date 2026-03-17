export type TenantStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';
export type IdProofType = 'AADHAAR' | 'PAN' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENSE';

// ── List / Table row ─────────────────────────────────────────────────────
export interface TenantResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  roomId: number | null;
  roomNumber: string | null;
  moveInDate: string;           // ISO date string e.g. '2025-03-01'
  monthlyRent: number;
  securityDeposit: number;
  rentDueDay: number;           // 1-28
  status: TenantStatus;
  isOverdue: boolean;
  daysOverdue: number;
}

// ── Create / Edit form payload ────────────────────────────────────────────
export interface TenantRequest {
  fullName: string;
  phone: string;
  email: string;
  roomId: number | null;        // null = PENDING tenant
  moveInDate: string;
  monthlyRent: number;
  securityDeposit: number;
  rentDueDay: number;
  idProofType: IdProofType;
  idNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
  permanentAddress: string;
}

// ── Detail page ──────────────────────────────────────────────────────────
export interface TenantDetailResponse extends TenantResponse {
  idProofType: IdProofType;
  idNumber: string;
  emergencyContact: string;
  emergencyPhone: string;
  permanentAddress: string;
  totalPaid: number;
  outstanding: number;
  stayDurationMonths: number;
  isGoodStanding: boolean;
}

// ── Stats cards ──────────────────────────────────────────────────────────
export interface TenantStats {
  active: number;           // was activeCount
  pending: number;          // was pendingCount
  inactive: number;         // was inactiveCount
  moveOutsThisMonth: number;
}

// ── Assign Room payload ──────────────────────────────────────────────────
export interface AssignRoomRequest {
  roomId: number;
}


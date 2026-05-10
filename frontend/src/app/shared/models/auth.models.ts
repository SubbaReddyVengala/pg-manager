// Matches backend AuthResponse.java exactly
export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  userId:       number;
  email:        string;
  fullName:     string;
  role:         string;
  ownerId:      number;
  isFirstLogin: boolean;
}

// Matches backend ErrorResponse.java exactly
export interface ApiError {
  status:    number;
  message:   string;
  path:      string;
  timestamp: string;
}

// Matches backend UserProfileResponse.java exactly
export interface UserProfile {
  userId:   number;
  email:    string;
  fullName: string;
  role:     string;
  ownerId:  number;
  isFirstLogin: boolean;
  tempPassword?: string;
}

// Used for login form
export interface LoginRequest {
  email:    string;
  password: string;
}

// Used for register form
export interface RegisterRequest {
  fullName: string;
  email:    string;
  phone:    string;
  password: string;
  maxRooms?: number;
  maxTenants?: number;
  dashboardEnabled?: boolean;
  paymentsEnabled?: boolean;
  reportsEnabled?: boolean;
  whatsappEnabled?: boolean;
  maintenanceEnabled?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword:  string;
  newPassword:      string;
}

// Matches backend AuthResponse.java exactly
export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  userId:       number;
  email:        string;
  fullName:     string;
  role:         string;
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
  password: string;
}

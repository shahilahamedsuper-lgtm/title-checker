import { apiClient, extractError } from "./client";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export async function loginWithPassword(email: string, password: string): Promise<TokenResponse> {
  try {
    const res = await apiClient.post<TokenResponse>("/api/auth/login", { email, password });
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Login failed."));
  }
}

export async function sendOTP(email: string): Promise<{ otp: string; expires_in_seconds: number }> {
  try {
    const res = await apiClient.post<{ message: string; otp: string; expires_in_seconds: number }>(
      "/api/auth/send-otp",
      { email }
    );
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Failed to send OTP."));
  }
}

export async function verifyOTP(email: string, otp: string): Promise<TokenResponse> {
  try {
    const res = await apiClient.post<TokenResponse>("/api/auth/verify-otp", { email, otp });
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "OTP verification failed."));
  }
}

export async function fetchMe(): Promise<UserProfile> {
  try {
    const res = await apiClient.get<UserProfile>("/api/auth/me");
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Failed to fetch profile."));
  }
}

export async function updateProfile(name: string): Promise<UserProfile> {
  try {
    const res = await apiClient.put<UserProfile>("/api/auth/profile", { name });
    return res.data;
  } catch (e) {
    throw new Error(extractError(e, "Failed to update profile."));
  }
}

export async function changePassword(current_password: string, new_password: string): Promise<void> {
  try {
    await apiClient.put("/api/auth/change-password", { current_password, new_password });
  } catch (e) {
    throw new Error(extractError(e, "Failed to change password."));
  }
}

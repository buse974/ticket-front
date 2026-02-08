import { apiClient } from "./client";

export type PlanType = "free" | "pro";

export interface Professional {
  id: number;
  email: string;
  name: string;
  plan: PlanType;
}

export interface AuthResponse {
  token: string;
  professional: Professional;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData extends LoginData {
  name: string;
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiClient<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMe(): Promise<Professional> {
  return apiClient<Professional>("/api/professional/me", { auth: true });
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
}): Promise<Professional> {
  return apiClient<Professional>("/api/professional/me", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/api/professional/password", {
    method: "PUT",
    auth: true,
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/api/professional/me", {
    method: "DELETE",
    auth: true,
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<{ success: boolean }> {
  return apiClient<{ success: boolean }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

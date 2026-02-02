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

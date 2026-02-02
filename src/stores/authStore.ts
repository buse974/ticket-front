import { create } from "zustand";
import type { Professional } from "@/api/auth";

interface AuthState {
  token: string | null;
  professional: Professional | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // To check if storage has been checked
  setAuth: (token: string, professional: Professional) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  professional: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: (token, professional) => {
    localStorage.setItem("token", token);
    localStorage.setItem("professional", JSON.stringify(professional));
    set({ token, professional, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("professional");
    set({ token: null, professional: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem("token");
    const professionalStr = localStorage.getItem("professional");
    if (token && professionalStr) {
      try {
        const professional = JSON.parse(professionalStr);
        set({
          token,
          professional,
          isAuthenticated: true,
          isInitialized: true,
        });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("professional");
        set({
          isInitialized: true,
          isAuthenticated: false,
          token: null,
          professional: null,
        });
      }
    } else {
      set({
        isInitialized: true,
        isAuthenticated: false,
        token: null,
        professional: null,
      });
    }
  },
}));

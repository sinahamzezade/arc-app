"use client";

import { create } from "zustand";

const RESET_KEY = "arc_reset_token";

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

type AuthUiState = {
  resetToken: string | null;
  setResetToken: (token: string | null) => void;
};

export const useAuthStore = create<AuthUiState>((set) => ({
  resetToken: typeof window !== "undefined" ? readStorage(RESET_KEY) : null,
  setResetToken: (resetToken) => {
    writeStorage(RESET_KEY, resetToken);
    set({ resetToken });
  },
}));

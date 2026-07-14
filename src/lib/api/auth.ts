import { apiFetch, refreshAccessToken } from "./client";
import { ApiError } from "./errors";
import type { AuthSessionResponse, MeResponse } from "./types";

export const authApi = {
  register(body: {
    name: string;
    email: string;
    password: string;
    agreeToTerms: boolean;
    referralCode?: string;
  }) {
    return apiFetch<AuthSessionResponse>("/auth/register", { body });
  },

  login(body: { email: string; password: string }) {
    return apiFetch<AuthSessionResponse>("/auth/login", { body });
  },

  logout() {
    return apiFetch<{ ok: boolean }>("/auth/logout", {
      method: "POST",
      body: {},
    });
  },

  async refresh() {
    const data = await refreshAccessToken();
    if (!data) {
      throw new ApiError({
        statusCode: 401,
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Refresh token missing",
      });
    }
    return data;
  },

  requestVerifyEmail(email: string) {
    return apiFetch<{ ok: boolean }>("/auth/verify-email/request", {
      body: { email },
    });
  },

  confirmVerifyEmail(email: string, otp: string) {
    return apiFetch<{ user: MeResponse["user"]; profile: MeResponse["profile"] | null }>(
      "/auth/verify-email/confirm",
      { body: { email, otp } },
    );
  },

  forgotPassword(email: string) {
    return apiFetch<{ ok: boolean }>("/auth/forgot-password", {
      body: { email },
    });
  },

  verifyForgotOtp(email: string, otp: string) {
    return apiFetch<{ resetToken: string }>(
      "/auth/forgot-password/verify-otp",
      { body: { email, otp } },
    );
  },

  resetPassword(body: {
    resetToken: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiFetch<{ ok: boolean }>("/auth/reset-password", { body });
  },

  changePassword(body: {
    currentPassword: string;
    password: string;
    confirmPassword: string;
  }) {
    return apiFetch<{ ok: boolean; passwordLastChangedAt: string }>(
      "/auth/change-password",
      { body },
    );
  },

  google(idToken: string) {
    return apiFetch<AuthSessionResponse>("/auth/google", {
      body: { idToken },
    });
  },

  apple(idToken: string) {
    return apiFetch<AuthSessionResponse>("/auth/apple", {
      body: { idToken },
    });
  },
};

export const meApi = {
  get() {
    return apiFetch<MeResponse>("/me");
  },

  updateProfile(body: {
    displayName?: string;
    username?: string;
    timezone?: string;
    language?: string;
  }) {
    return apiFetch<{ profile: MeResponse["profile"] }>("/me/profile", {
      method: "PATCH",
      body,
    });
  },
};

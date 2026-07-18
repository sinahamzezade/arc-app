import { apiFetch } from "./client";

export type PublicSystemFlags = {
  otp_verification_enabled: boolean;
  intake_chat_enabled: boolean;
  intake_default_mode: string;
  arlo_ai_enabled: boolean;
  sso_enabled: boolean;
  avatar_studio_enabled: boolean;
  video_call_enabled: boolean;
  voice_call_enabled: boolean;
};

export const systemFlagsApi = {
  getPublic() {
    return apiFetch<PublicSystemFlags>("/system/flags", { method: "GET" });
  },

  /** Resolved for the signed-in user (overrides applied). */
  getMine(accessToken?: string | null) {
    return apiFetch<PublicSystemFlags>("/system/flags/me", {
      method: "GET",
      accessToken,
    });
  },
};

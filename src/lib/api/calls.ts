import { apiFetch } from "@/lib/api/client";

export type CallMode = "audio" | "video";

export type IceServersResponse = {
  iceServers: RTCIceServer[];
  ttlSec: number;
};

export type CallHistoryItem = {
  id: string;
  conversationId: string;
  callerId: string;
  calleeId: string;
  mode: CallMode;
  state: string;
  endReason: string | null;
  usedTurn: boolean;
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  createdAt: string;
};

export const callsApi = {
  getIceServers(accessToken?: string | null) {
    return apiFetch<IceServersResponse>("/calls/ice-servers", { accessToken });
  },

  getHistory(limit = 30, accessToken?: string | null) {
    return apiFetch<CallHistoryItem[]>(
      `/calls/history?limit=${limit}`,
      { accessToken },
    );
  },
};

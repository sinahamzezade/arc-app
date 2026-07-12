import { create } from "zustand";
import type { StudySessionDto, StudySessionStatusDto } from "@/lib/api/study";

export type StudyLiveSnapshot = {
  sessionId: string;
  status: StudySessionStatusDto;
  partnerName: string;
  partnerInitial: string;
  partnerColor: string;
  subject: string;
  durationMinutes: number;
  remainingSeconds: number | null;
  serverNow: string;
  /** Local epoch when remainingSeconds was captured — for smooth countdown. */
  capturedAtMs: number;
};

type StudyLiveState = {
  live: StudyLiveSnapshot | null;
  applySession: (dto: StudySessionDto) => void;
  clear: () => void;
};

const LIVE_STATUSES = new Set<StudySessionStatusDto>([
  "accepted",
  "waiting",
  "active",
]);

export function isStudyLiveStatus(status: StudySessionStatusDto) {
  return LIVE_STATUSES.has(status);
}

export const useStudyLiveStore = create<StudyLiveState>((set) => ({
  live: null,
  applySession: (dto) => {
    if (!isStudyLiveStatus(dto.status)) {
      set((s) =>
        s.live?.sessionId === dto.id ? { live: null } : s,
      );
      return;
    }
    set({
      live: {
        sessionId: dto.id,
        status: dto.status,
        partnerName: dto.partner.name,
        partnerInitial: dto.partner.initial,
        partnerColor: "#6B4EFF",
        subject: dto.subject,
        durationMinutes: dto.durationMinutes,
        remainingSeconds: dto.remainingSeconds,
        serverNow: dto.serverNow,
        capturedAtMs: Date.now(),
      },
    });
  },
  clear: () => set({ live: null }),
}));

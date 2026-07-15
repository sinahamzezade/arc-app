import { create } from "zustand";
import type { StudySessionDto, StudySessionStatusDto } from "@/lib/api/study";

export type StudyLiveSnapshot = {
  sessionId: string;
  status: StudySessionStatusDto;
  partnerName: string;
  partnerInitial: string;
  partnerColor: string;
  subject: string;
  lessonTitle: string | null;
  durationMinutes: number;
  remainingSeconds: number | null;
  serverNow: string;
  capturedAtMs: number;
};

type StudyLiveState = {
  rooms: StudyLiveSnapshot[];
  applySessions: (dtos: StudySessionDto[]) => void;
  applySession: (dto: StudySessionDto) => void;
  clear: () => void;
};

const LIVE_STATUSES = new Set<StudySessionStatusDto>([
  "invited",
  "accepted",
  "waiting",
  "active",
]);

export function isStudyLiveStatus(status: StudySessionStatusDto) {
  return LIVE_STATUSES.has(status);
}

function toSnapshot(dto: StudySessionDto): StudyLiveSnapshot {
  return {
    sessionId: dto.id,
    status: dto.status,
    partnerName: dto.partner.name,
    partnerInitial: dto.partner.initial,
    partnerColor: "#6B4EFF",
    subject: dto.subject,
    lessonTitle: dto.lessonTitle,
    durationMinutes: dto.durationMinutes,
    remainingSeconds: dto.remainingSeconds,
    serverNow: dto.serverNow,
    capturedAtMs: Date.now(),
  };
}

export const useStudyLiveStore = create<StudyLiveState>((set) => ({
  rooms: [],
  applySessions: (dtos) => {
    const live = dtos.filter((d) => isStudyLiveStatus(d.status)).map(toSnapshot);
    set({ rooms: live });
  },
  applySession: (dto) => {
    if (!isStudyLiveStatus(dto.status)) {
      set((s) => ({
        rooms: s.rooms.filter((r) => r.sessionId !== dto.id),
      }));
      return;
    }
    const snap = toSnapshot(dto);
    set((s) => {
      const rest = s.rooms.filter((r) => r.sessionId !== dto.id);
      return { rooms: [snap, ...rest] };
    });
  },
  clear: () => set({ rooms: [] }),
}));

/** @deprecated use rooms[0] */
export function useStudyLivePrimary() {
  return useStudyLiveStore((s) => s.rooms[0] ?? null);
}

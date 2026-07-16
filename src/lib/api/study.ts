import { apiFetch, apiFetchBlob, apiFetchFormData } from "./client";

export type StudySessionStatusDto =
  | "draft"
  | "invited"
  | "accepted"
  | "waiting"
  | "active"
  | "completed"
  | "declined"
  | "expired"
  | "cancelled"
  | "abandoned"
  | "partially_completed"
  | "voided";

export type StudyStartModeDto = "now" | "within_1_hour" | "scheduled";
export type StudySessionModeDto = "focus" | "read_together";

export type StudyParticipantDto = {
  userId: string;
  role: "creator" | "invitee";
  name: string;
  initial: string;
  avatarUrl: string | null;
  invitationStatus: string;
  taskId: string | null;
  taskLabel: string | null;
  ackedStep: number;
  typingAt: string | null;
  ready: boolean;
  joinedAt: string | null;
  leftAt: string | null;
  verifiedActiveSeconds: number;
  heartbeatCount: number;
  lastHeartbeatAt: string | null;
  appVisible: boolean;
  meaningfulActionCompleted: boolean;
  completionConfirmed: boolean;
  qualified: boolean;
  progressHint: number;
};

export type StudySessionDto = {
  id: string;
  status: StudySessionStatusDto;
  mode: StudySessionModeDto;
  subject: string;
  lessonId: string | null;
  lessonTitle: string | null;
  contentStep: number;
  stepCount: number;
  durationMinutes: number;
  startMode: StudyStartModeDto;
  message: string | null;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  inviteExpiresAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  plannedEndAt: string | null;
  remainingSeconds: number | null;
  roomVersion: number;
  completionOutcome: string;
  sharedBonusGranted: boolean;
  sharedBonus: { coins: number; gems: number } | null;
  role: "creator" | "invitee";
  you: StudyParticipantDto;
  partner: StudyParticipantDto;
  serverNow: string;
  createdAt: string;
};

export type StudyContentDto = {
  sessionId: string;
  lessonId: string;
  lessonTitle: string;
  contentStep: number;
  stepCount: number;
  body: {
    objective?: string;
    sections?: Array<
      | string
      | {
          id: string;
          title: string;
          blocks: Array<{
            type: "text" | "callout" | "code";
            body?: string;
            title?: string;
            code?: string;
            label?: string;
          }>;
        }
    >;
    keyTakeaways?: string[];
  };
};

export type StudyStepDto = {
  contentStep: number;
  stepCount: number;
  acks: { userId: string; ackedStep: number }[];
  advanced: boolean;
  readingComplete: boolean;
};

export type StudyAckResultDto = {
  state: StudySessionDto;
  step: StudyStepDto | null;
};

export type StudyMessageKindDto = "text" | "voice" | "image";

export type StudyMessageDto = {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  kind: StudyMessageKindDto;
  body: string;
  mediaUrl: string | null;
  mediaMime: string | null;
  durationMs: number | null;
  /** True when partner has read this outgoing message. */
  seen: boolean;
  createdAt: string;
};

export type StudyChatReadReceiptDto = {
  userId: string;
  readAt: string;
  messageId: string | null;
};

export type CreateStudySessionInput = {
  inviteeId: string;
  lessonId: string;
  subject: string;
  durationMinutes: number;
  startMode: StudyStartModeDto;
  message?: string;
  scheduledStartAt?: string;
};

export const studyApi = {
  create(input: CreateStudySessionInput, accessToken?: string | null) {
    return apiFetch<StudySessionDto>("/study-together", {
      method: "POST",
      body: input,
      accessToken,
    });
  },

  rooms(accessToken?: string | null) {
    return apiFetch<{ items: StudySessionDto[] }>("/study-together/rooms", {
      accessToken,
    });
  },

  invites(accessToken?: string | null) {
    return apiFetch<{ items: StudySessionDto[] }>("/study-together/invites", {
      accessToken,
    });
  },

  history(cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{ items: StudySessionDto[]; nextCursor: string | null }>(
      `/study-together/history${q}`,
      { accessToken },
    );
  },

  accept(id: string, accessToken?: string | null) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/accept`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  decline(id: string, accessToken?: string | null) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/decline`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  cancel(id: string, accessToken?: string | null) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/cancel`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  setTask(
    id: string,
    body: {
      taskId?: string;
      taskLabel?: string;
      meaningfulAction?: boolean;
    },
    accessToken?: string | null,
  ) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/task`, {
      method: "POST",
      body,
      accessToken,
    });
  },

  ready(id: string, accessToken?: string | null) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/ready`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  heartbeat(
    id: string,
    body?: { appVisible?: boolean; focusActive?: boolean },
    accessToken?: string | null,
  ) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/heartbeat`, {
      method: "POST",
      body: body ?? { appVisible: true, focusActive: true },
      accessToken,
    });
  },

  content(id: string, accessToken?: string | null) {
    return apiFetch<StudyContentDto>(`/study-together/${id}/content`, {
      accessToken,
    });
  },

  ackRead(
    id: string,
    body?: { soloAdvance?: boolean },
    accessToken?: string | null,
  ) {
    return apiFetch<StudyAckResultDto>(`/study-together/${id}/ack-read`, {
      method: "POST",
      body: body ?? {},
      accessToken,
    });
  },

  messages(id: string, cursor?: string, accessToken?: string | null) {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return apiFetch<{ items: StudyMessageDto[]; nextCursor: string | null }>(
      `/study-together/${id}/messages${q}`,
      { accessToken },
    );
  },

  sendMessage(id: string, body: string, accessToken?: string | null) {
    return apiFetch<StudyMessageDto>(`/study-together/${id}/messages`, {
      method: "POST",
      body: { body },
      accessToken,
    });
  },

  markMessagesRead(
    id: string,
    messageId?: string,
    accessToken?: string | null,
  ) {
    return apiFetch<StudyChatReadReceiptDto>(
      `/study-together/${id}/messages/read`,
      {
        method: "POST",
        body: messageId ? { messageId } : {},
        accessToken,
      },
    );
  },

  sendMedia(
    id: string,
    file: Blob,
    meta: {
      kind: "voice" | "image";
      durationMs?: number;
      caption?: string;
      filename?: string;
    },
    accessToken?: string | null,
  ) {
    const form = new FormData();
    form.append(
      "file",
      file,
      meta.filename ??
        (meta.kind === "voice" ? "voice.webm" : "photo.jpg"),
    );
    form.append("kind", meta.kind);
    if (meta.durationMs != null) {
      form.append("durationMs", String(meta.durationMs));
    }
    if (meta.caption) {
      form.append("caption", meta.caption);
    }
    return apiFetchFormData<StudyMessageDto>(
      `/study-together/${id}/messages/media`,
      form,
      accessToken,
    );
  },

  async fetchMediaBlob(
    sessionId: string,
    messageId: string,
    accessToken?: string | null,
  ): Promise<Blob> {
    return apiFetchBlob(
      `/study-together/${sessionId}/media/${messageId}`,
      accessToken,
    );
  },

  state(id: string, accessToken?: string | null) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/state`, {
      accessToken,
    });
  },

  leave(id: string, accessToken?: string | null) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/leave`, {
      method: "POST",
      body: {},
      accessToken,
    });
  },

  complete(
    id: string,
    body?: { meaningfulAction?: boolean },
    accessToken?: string | null,
  ) {
    return apiFetch<StudySessionDto>(`/study-together/${id}/complete`, {
      method: "POST",
      body: body ?? { meaningfulAction: true },
      accessToken,
    });
  },
};

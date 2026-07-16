import type { Socket } from "socket.io-client";
import type { NotificationDto } from "@/lib/api/types";
import type { IncomingCallPayload } from "@/hooks/useCallSession";

export type NotificationNewPayload = {
  notification: NotificationDto;
  unreadCount: number;
};

type NewHandler = (payload: NotificationNewPayload) => void;
type ConnectedHandler = (connected: boolean) => void;
type ChatUnreadHandler = (unreadTotal: number) => void;
type SocketHandler = (socket: Socket | null) => void;
type SeedCallHandler = (payload: IncomingCallPayload) => void;
/** Toast Answer — seed + accept in one shot. */
type AnswerCallHandler = (payload: IncomingCallPayload) => void;

const newHandlers = new Set<NewHandler>();
const connectedHandlers = new Set<ConnectedHandler>();
const chatUnreadHandlers = new Set<ChatUnreadHandler>();
const socketHandlers = new Set<SocketHandler>();
const seedCallHandlers = new Set<SeedCallHandler>();
const answerCallHandlers = new Set<AnswerCallHandler>();

let connected = false;
let chatSocket: Socket | null = null;

/** Subscribe to in-app `notification.new` from ChatRealtimeHost. */
export function subscribeNotificationNew(handler: NewHandler) {
  newHandlers.add(handler);
  return () => {
    newHandlers.delete(handler);
  };
}

/** Subscribe to global /chat socket connect state. */
export function subscribeChatRealtimeConnected(handler: ConnectedHandler) {
  connectedHandlers.add(handler);
  handler(connected);
  return () => {
    connectedHandlers.delete(handler);
  };
}

/** Subscribe to chat `unread.changed` from the shared host. */
export function subscribeChatUnreadChanged(handler: ChatUnreadHandler) {
  chatUnreadHandlers.add(handler);
  return () => {
    chatUnreadHandlers.delete(handler);
  };
}

/** Shared app-wide /chat socket (CallHost + badges). */
export function subscribeChatSocket(handler: SocketHandler) {
  socketHandlers.add(handler);
  handler(chatSocket);
  return () => {
    socketHandlers.delete(handler);
  };
}

export function getChatSocket() {
  return chatSocket;
}

export function getChatRealtimeConnected() {
  return connected;
}

/**
 * Seed an incoming call from notification toast
 * (WS event may have been missed if CallHost mounted late).
 */
export function seedIncomingCallFromToast(payload: IncomingCallPayload) {
  for (const h of seedCallHandlers) h(payload);
}

export function subscribeSeedIncomingCall(handler: SeedCallHandler) {
  seedCallHandlers.add(handler);
  return () => {
    seedCallHandlers.delete(handler);
  };
}

/** Toast Answer — accept immediately via CallHost. */
export function answerIncomingCallFromToast(payload: IncomingCallPayload) {
  for (const h of answerCallHandlers) h(payload);
}

export function subscribeAnswerIncomingCall(handler: AnswerCallHandler) {
  answerCallHandlers.add(handler);
  return () => {
    answerCallHandlers.delete(handler);
  };
}

/** @internal — ChatRealtimeHost only */
export function publishNotificationNew(payload: NotificationNewPayload) {
  for (const h of newHandlers) h(payload);
}

/** @internal — ChatRealtimeHost only */
export function publishChatRealtimeConnected(next: boolean) {
  if (connected === next) return;
  connected = next;
  for (const h of connectedHandlers) h(next);
}

/** @internal — ChatRealtimeHost only */
export function publishChatUnreadChanged(unreadTotal: number) {
  for (const h of chatUnreadHandlers) h(unreadTotal);
}

/** @internal — ChatRealtimeHost only */
export function publishChatSocket(socket: Socket | null) {
  chatSocket = socket;
  for (const h of socketHandlers) h(socket);
}

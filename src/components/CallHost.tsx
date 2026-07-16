"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type { Socket } from "socket.io-client";
import { CallScreen } from "@/components/chat/CallScreen";
import {
  useCallSession,
  type IncomingCallPayload,
} from "@/hooks/useCallSession";
import { useCallRingtone } from "@/hooks/useCallRingtone";
import {
  subscribeAnswerIncomingCall,
  subscribeChatRealtimeConnected,
  subscribeChatSocket,
  subscribeSeedIncomingCall,
} from "@/lib/chat/realtime-bus";

type CallSessionApi = ReturnType<typeof useCallSession>;

const CallContext = createContext<CallSessionApi | null>(null);

export function useAppCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useAppCall must be used within CallHost");
  }
  return ctx;
}

export function useAppCallOptional() {
  return useContext(CallContext);
}

/**
 * App-wide call UI + signaling on the shared /chat socket.
 * Fixes toast Open declining calls (session lived only on chat routes).
 */
export function CallHost({ children }: { children?: ReactNode }) {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [peerName, setPeerName] = useState("Contact");

  useEffect(() => {
    return subscribeChatSocket((socket) => {
      socketRef.current = socket;
    });
  }, []);

  useEffect(() => {
    return subscribeChatRealtimeConnected(setConnected);
  }, []);

  const call = useCallSession({
    socketRef,
    connected,
    myUserId: session?.user?.id ?? null,
  });

  useEffect(() => {
    return subscribeSeedIncomingCall((payload: IncomingCallPayload) => {
      if (payload.fromName) setPeerName(payload.fromName);
      call.seedIncoming(payload);
    });
    // seedIncoming is stable; avoid re-sub on every call object identity change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.seedIncoming]);

  useEffect(() => {
    return subscribeAnswerIncomingCall((payload: IncomingCallPayload) => {
      if (payload.fromName) setPeerName(payload.fromName);
      call.seedIncoming(payload);
      void call.acceptIncoming(payload);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.seedIncoming, call.acceptIncoming]);

  useCallRingtone(
    call.uiState === "ringing_in" || call.uiState === "ringing_out",
  );

  useEffect(() => {
    if (call.incoming?.fromName) {
      setPeerName(call.incoming.fromName);
    }
  }, [call.incoming?.fromName]);

  const value = useMemo(() => call, [call]);

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallScreen call={call} peerName={peerName} />
    </CallContext.Provider>
  );
}

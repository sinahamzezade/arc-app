"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useSession } from "next-auth/react";
import { callsApi, type CallMode } from "@/lib/api/calls";
import type { Socket } from "socket.io-client";

export type CallUiState =
  | "idle"
  | "ringing_out"
  | "ringing_in"
  | "connecting"
  | "active"
  | "ended";

export type IncomingCallPayload = {
  callId: string;
  conversationId: string;
  fromUserId: string;
  mode: CallMode;
};

type UseCallSessionOpts = {
  socketRef: MutableRefObject<Socket | null>;
  connected: boolean;
  myUserId: string | null;
};

function newCallId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function emitAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
): Promise<T | null> {
  return new Promise((resolve) => {
    socket.emit(event, payload, (res: unknown) => {
      if (!res || typeof res !== "object") {
        resolve(null);
        return;
      }
      const obj = res as { ok?: boolean; error?: string } & T;
      if (obj.error || !obj.ok) {
        resolve(null);
        return;
      }
      resolve(obj);
    });
  });
}

/**
 * 1:1 WebRTC call session — signaling via /chat socket, media P2P/TURN.
 */
export function useCallSession({
  socketRef,
  connected,
  myUserId,
}: UseCallSessionOpts) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [uiState, setUiState] = useState<CallUiState>("idle");
  const [mode, setMode] = useState<CallMode>("audio");
  const [callId, setCallId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<IncomingCallPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [endedReason, setEndedReason] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const usedTurnRef = useRef(false);
  const makingOfferRef = useRef(false);
  const politeRef = useRef(false); // callee is polite
  const callIdRef = useRef<string | null>(null);
  const activeSinceRef = useRef<number | null>(null);
  const durationTimer = useRef<number | null>(null);

  callIdRef.current = callId;

  const cleanupMedia = useCallback(() => {
    if (durationTimer.current) {
      window.clearInterval(durationTimer.current);
      durationTimer.current = null;
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    usedTurnRef.current = false;
    makingOfferRef.current = false;
    activeSinceRef.current = null;
  }, []);

  const resetToIdle = useCallback(() => {
    cleanupMedia();
    setUiState("idle");
    setCallId(null);
    setConversationId(null);
    setIncoming(null);
    setError(null);
    setMuted(false);
    setCameraOff(false);
    setEndedReason(null);
    setDurationSec(0);
  }, [cleanupMedia]);

  const startDurationTick = useCallback(() => {
    activeSinceRef.current = Date.now();
    if (durationTimer.current) window.clearInterval(durationTimer.current);
    durationTimer.current = window.setInterval(() => {
      if (activeSinceRef.current) {
        setDurationSec(
          Math.floor((Date.now() - activeSinceRef.current) / 1000),
        );
      }
    }, 1000);
  }, []);

  const ensurePc = useCallback(
    async (iceServers: RTCIceServer[]) => {
      if (pcRef.current) return pcRef.current;
      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      pc.onicecandidate = (ev) => {
        const socket = socketRef.current;
        if (!ev.candidate || !socket || !callIdRef.current) return;
        const cand = ev.candidate.candidate || "";
        if (cand.includes("typ relay")) {
          usedTurnRef.current = true;
        }
        socket.emit("call.ice", {
          callId: callIdRef.current,
          candidate: ev.candidate.toJSON(),
        });
      };

      pc.ontrack = (ev) => {
        const stream = ev.streams[0] ?? new MediaStream([ev.track]);
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      };

      pc.onconnectionstatechange = () => {
        const st = pc.connectionState;
        if (st === "connected") {
          setUiState("active");
          if (!activeSinceRef.current) startDurationTick();
          const sock = socketRef.current;
          if (sock && callIdRef.current) {
            sock.emit("call.connected", { callId: callIdRef.current });
          }
        } else if (st === "failed") {
          void hangupInternal(true);
        }
      };

      return pc;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [socketRef, startDurationTick],
  );

  const getLocalMedia = useCallback(async (callMode: CallMode) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callMode === "video",
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const hangupInternal = useCallback(
    async (failed = false) => {
      const id = callIdRef.current;
      const socket = socketRef.current;
      if (socket && id && connected) {
        await emitAck(socket, "call.hangup", {
          callId: id,
          usedTurn: usedTurnRef.current,
          failed,
        });
      }
      setEndedReason(failed ? "failed" : "completed");
      setUiState("ended");
      cleanupMedia();
      window.setTimeout(() => resetToIdle(), 1600);
    },
    [socketRef, connected, cleanupMedia, resetToIdle],
  );

  const startCall = useCallback(
    async (convId: string, callMode: CallMode) => {
      const socket = socketRef.current;
      if (!socket || !connected || !token || uiState !== "idle") return;
      setError(null);
      const id = newCallId();
      setCallId(id);
      callIdRef.current = id;
      setConversationId(convId);
      setMode(callMode);
      setUiState("ringing_out");
      politeRef.current = false;

      try {
        const ice = await callsApi.getIceServers(token);
        const stream = await getLocalMedia(callMode);
        const pc = await ensurePc(ice.iceServers);
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream);
        }

        const res = await emitAck<{ error?: string }>(socket, "call.invite", {
          conversationId: convId,
          mode: callMode,
          callId: id,
        });
        if (!res) {
          setError("Could not start call");
          resetToIdle();
          return;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not start call",
        );
        resetToIdle();
      }
    },
    [
      socketRef,
      connected,
      token,
      uiState,
      getLocalMedia,
      ensurePc,
      resetToIdle,
    ],
  );

  const acceptIncoming = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket || !connected || !token || !incoming) return;
    setError(null);
    const { callId: id, conversationId: convId, mode: callMode } = incoming;
    setCallId(id);
    callIdRef.current = id;
    setConversationId(convId);
    setMode(callMode);
    setIncoming(null);
    setUiState("connecting");
    politeRef.current = true;

    try {
      const ice = await callsApi.getIceServers(token);
      const stream = await getLocalMedia(callMode);
      const pc = await ensurePc(ice.iceServers);
      for (const track of stream.getTracks()) {
        pc.addTrack(track, stream);
      }

      const res = await emitAck(socket, "call.accept", { callId: id });
      if (!res) {
        setError("Could not accept call");
        resetToIdle();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
      resetToIdle();
    }
  }, [
    socketRef,
    connected,
    token,
    incoming,
    getLocalMedia,
    ensurePc,
    resetToIdle,
  ]);

  const declineIncoming = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket || !incoming) {
      setIncoming(null);
      return;
    }
    await emitAck(socket, "call.decline", { callId: incoming.callId });
    setIncoming(null);
    setUiState("idle");
  }, [socketRef, incoming]);

  const hangup = useCallback(() => {
    void hangupInternal(false);
  }, [hangupInternal]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
  }, [muted]);

  const toggleCamera = useCallback(() => {
    const next = !cameraOff;
    setCameraOff(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
  }, [cameraOff]);

  const upgradeToVideo = useCallback(async () => {
    const socket = socketRef.current;
    if (!socket || !callIdRef.current || mode === "video") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || !pcRef.current || !localStreamRef.current) return;
      localStreamRef.current.addTrack(videoTrack);
      setLocalStream(localStreamRef.current);
      pcRef.current.addTrack(videoTrack, localStreamRef.current);
      setMode("video");
      socket.emit("call.upgrade", {
        callId: callIdRef.current,
        mode: "video",
      });
      makingOfferRef.current = true;
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("call.sdp", {
        callId: callIdRef.current,
        sdp: offer.sdp,
        type: "offer",
      });
      makingOfferRef.current = false;
    } catch {
      setError("Camera unavailable");
    }
  }, [socketRef, mode]);

  // Signaling listeners
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;

    const onIncoming = (payload: IncomingCallPayload) => {
      setIncoming((prev) => {
        if (prev) return prev;
        return payload;
      });
      setUiState((s) => (s === "idle" ? "ringing_in" : s));
    };

    const onAccepted = async (payload: { callId: string }) => {
      if (payload.callId !== callIdRef.current || !pcRef.current) return;
      setUiState("connecting");
      try {
        makingOfferRef.current = true;
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit("call.sdp", {
          callId: payload.callId,
          sdp: offer.sdp,
          type: "offer",
        });
        makingOfferRef.current = false;
      } catch {
        void hangupInternal(true);
      }
    };

    const onDeclined = (payload: { callId: string }) => {
      if (payload.callId !== callIdRef.current) return;
      setEndedReason("declined");
      setUiState("ended");
      cleanupMedia();
      window.setTimeout(() => resetToIdle(), 1600);
    };

    const onEnded = (payload: {
      callId: string;
      endReason?: string;
      durationSec?: number;
    }) => {
      setIncoming((prev) =>
        prev?.callId === payload.callId ? null : prev,
      );
      if (
        callIdRef.current &&
        payload.callId !== callIdRef.current
      ) {
        return;
      }
      if (!callIdRef.current && payload.callId) {
        // ended incoming we hadn't accepted
        setUiState("idle");
        return;
      }
      setEndedReason(payload.endReason ?? "ended");
      if (typeof payload.durationSec === "number") {
        setDurationSec(payload.durationSec);
      }
      setUiState("ended");
      cleanupMedia();
      window.setTimeout(() => resetToIdle(), 1600);
    };

    const onSdp = async (payload: {
      callId: string;
      sdp: string;
      type: "offer" | "answer";
    }) => {
      if (payload.callId !== callIdRef.current || !pcRef.current) return;
      const pc = pcRef.current;
      const desc = new RTCSessionDescription({
        type: payload.type,
        sdp: payload.sdp,
      });

      try {
        const offerCollision =
          payload.type === "offer" &&
          (makingOfferRef.current || pc.signalingState !== "stable");
        if (offerCollision) {
          if (!politeRef.current) return;
          await Promise.all([
            pc.setLocalDescription({ type: "rollback" }),
            pc.setRemoteDescription(desc),
          ]);
        } else {
          await pc.setRemoteDescription(desc);
        }

        if (payload.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("call.sdp", {
            callId: payload.callId,
            sdp: answer.sdp,
            type: "answer",
          });
        }
      } catch {
        void hangupInternal(true);
      }
    };

    const onIce = async (payload: {
      callId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (payload.callId !== callIdRef.current || !pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(payload.candidate);
      } catch {
        // ignore late candidates
      }
    };

    const onUpgrade = (payload: { callId: string; mode: CallMode }) => {
      if (payload.callId !== callIdRef.current) return;
      if (payload.mode === "video") setMode("video");
    };

    socket.on("call.incoming", onIncoming);
    socket.on("call.accepted", onAccepted);
    socket.on("call.declined", onDeclined);
    socket.on("call.ended", onEnded);
    socket.on("call.sdp", onSdp);
    socket.on("call.ice", onIce);
    socket.on("call.upgrade", onUpgrade);

    return () => {
      socket.off("call.incoming", onIncoming);
      socket.off("call.accepted", onAccepted);
      socket.off("call.declined", onDeclined);
      socket.off("call.ended", onEnded);
      socket.off("call.sdp", onSdp);
      socket.off("call.ice", onIce);
      socket.off("call.upgrade", onUpgrade);
    };
  }, [
    socketRef,
    connected,
    cleanupMedia,
    resetToIdle,
    hangupInternal,
  ]);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  return {
    uiState,
    mode,
    callId,
    conversationId,
    incoming,
    error,
    muted,
    cameraOff,
    endedReason,
    durationSec,
    localStream,
    remoteStream,
    myUserId,
    startCall,
    acceptIncoming,
    declineIncoming,
    hangup,
    toggleMute,
    toggleCamera,
    upgradeToVideo,
    dismissEnded: resetToIdle,
  };
}

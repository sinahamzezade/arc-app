"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { useCallSession } from "@/hooks/useCallSession";
import { cn } from "@/lib/utils";

type CallSessionApi = ReturnType<typeof useCallSession>;

type CallScreenProps = {
  call: CallSessionApi;
  peerName?: string;
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function statusLabel(call: CallSessionApi) {
  switch (call.uiState) {
    case "ringing_out":
      return "Ringing…";
    case "ringing_in":
      return call.mode === "video" ? "Video call" : "Voice call";
    case "connecting":
      return "Connecting…";
    case "active":
      return formatDuration(call.durationSec);
    case "ended":
      if (call.endedReason === "declined") return "Declined";
      if (call.endedReason === "failed") return "Couldn't connect";
      if (call.endedReason === "missed") return "Missed";
      if (call.endedReason === "busy") return "Busy";
      if (call.endedReason === "cancelled") return "Cancelled";
      return call.durationSec > 0
        ? `Ended · ${formatDuration(call.durationSec)}`
        : "Ended";
    default:
      return "";
  }
}

function initialOf(name: string) {
  return (name.trim()[0] || "?").toUpperCase();
}

/**
 * Arc call overlay — night stage, gold/purple atmosphere, distinct
 * incoming vs outgoing compositions.
 */
export function CallScreen({ call, peerName = "Contact" }: CallScreenProps) {
  const reduceMotion = useReducedMotion();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const visible = call.uiState !== "idle";
  const isIncoming = call.uiState === "ringing_in";
  const isEnded = call.uiState === "ended";
  const isActiveStage =
    call.uiState === "active" ||
    call.uiState === "connecting" ||
    call.uiState === "ringing_out";

  useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  useEffect(() => {
    if (call.remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = call.remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = call.remoteStream;
      }
    }
  }, [call.remoteStream]);

  if (!visible) return null;

  const remoteLive =
    call.mode === "video" &&
    !!call.remoteStream &&
    (call.uiState === "active" || call.uiState === "connecting");

  const showLocalPip =
    call.mode === "video" &&
    !!call.localStream &&
    !call.cameraOff &&
    isActiveStage;

  return (
    <div className="fixed inset-0 z-[80] mx-auto flex max-w-md flex-col overflow-hidden bg-[#0a0c16] font-rounded text-white">
      {/* Atmosphere */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-arc-purple-500/35 blur-[90px]" />
        <div className="absolute right-[-20%] bottom-[18%] h-64 w-64 rounded-full bg-[#ffc928]/12 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(179,92,255,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(10,12,22,0.92)_78%)]" />
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Top chrome */}
      <header className="relative z-20 flex items-start justify-between px-5 pt-[calc(env(safe-area-inset-top)+14px)]">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.18em] text-white/35 uppercase">
            Arc
          </p>
          <p className="mt-0.5 text-[11px] font-bold tracking-wide text-[#ffc928]/90 uppercase">
            {isIncoming ? "Incoming" : call.mode === "video" ? "Video" : "Voice"}
          </p>
        </div>
        {!isIncoming && !isEnded ? (
          <span className="rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-bold text-white/70 ring-1 ring-white/10">
            {statusLabel(call)}
          </span>
        ) : null}
      </header>

      {/* Stage */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        {remoteLive ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        {isIncoming ? (
          <IncomingStage
            peerName={peerName}
            mode={call.mode}
            reduceMotion={!!reduceMotion}
            error={call.error}
          />
        ) : (
          <OutgoingStage
            peerName={peerName}
            call={call}
            remoteLive={remoteLive}
            reduceMotion={!!reduceMotion}
            status={statusLabel(call)}
          />
        )}

        {showLocalPip ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-4 bottom-[7.5rem] z-20 overflow-hidden rounded-[18px] shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-2 ring-[#ffc928]/50"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-[9.5rem] w-[7rem] object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-[#0a0c16]/75 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white/90 uppercase">
              You
            </span>
          </motion.div>
        ) : null}
      </div>

      {/* Controls */}
      <footer className="relative z-20 px-5 pb-[calc(env(safe-area-inset-bottom)+22px)]">
        {isIncoming ? (
          <div className="rounded-[28px] bg-white/8 p-4 ring-1 ring-white/12 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <ActionPill
                label="Decline"
                tone="danger"
                onClick={() => void call.declineIncoming()}
                icon={<PhoneOff className="h-6 w-6" strokeWidth={2.25} />}
              />
              <ActionPill
                label="Accept"
                tone="accept"
                onClick={() => void call.acceptIncoming()}
                icon={<Phone className="h-6 w-6" strokeWidth={2.25} />}
                pulse={!reduceMotion}
              />
            </div>
          </div>
        ) : isEnded ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-bold text-white/55">{statusLabel(call)}</p>
            {call.error ? (
              <p className="max-w-xs text-center text-sm font-bold text-[#ff8a96]">
                {call.error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={call.dismissEnded}
              className="cursor-pointer rounded-2xl bg-[#ffc928] px-8 py-3.5 text-sm font-extrabold text-[#0f1220] shadow-[0_4px_0_#c79a2e] transition-colors duration-200 hover:bg-[#ffd24d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="rounded-[28px] bg-white/8 px-4 py-3.5 ring-1 ring-white/12 backdrop-blur-xl">
            <div className="flex items-center justify-center gap-3">
              <DockBtn
                label={call.muted ? "Unmute" : "Mute"}
                active={call.muted}
                onClick={call.toggleMute}
              >
                {call.muted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </DockBtn>

              {call.mode === "video" ? (
                <DockBtn
                  label={call.cameraOff ? "Camera on" : "Camera off"}
                  active={call.cameraOff}
                  onClick={call.toggleCamera}
                >
                  {call.cameraOff ? (
                    <VideoOff className="h-5 w-5" />
                  ) : (
                    <Video className="h-5 w-5" />
                  )}
                </DockBtn>
              ) : call.uiState === "active" ? (
                <DockBtn
                  label="Video"
                  onClick={() => void call.upgradeToVideo()}
                >
                  <Video className="h-5 w-5" />
                </DockBtn>
              ) : (
                <DockBtn label="Video" disabled>
                  <Video className="h-5 w-5 opacity-40" />
                </DockBtn>
              )}

              <button
                type="button"
                aria-label="Hang up"
                onClick={call.hangup}
                className="flex h-[3.75rem] w-[3.75rem] cursor-pointer items-center justify-center rounded-2xl bg-[#ff4d5a] text-white shadow-[0_5px_0_#c2303c] transition-colors duration-200 hover:bg-[#ff6570] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-px active:shadow-none"
              >
                <PhoneOff className="h-6 w-6" strokeWidth={2.25} />
              </button>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
}

function IncomingStage({
  peerName,
  mode,
  reduceMotion,
  error,
}: {
  peerName: string;
  mode: "audio" | "video";
  reduceMotion: boolean;
  error: string | null;
}) {
  return (
    <div className="relative flex flex-1 flex-col justify-end px-6 pb-6 pt-10">
      <motion.div
        className="mb-auto flex flex-col items-start"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffc928] px-3 py-1 text-[11px] font-extrabold tracking-wide text-[#0f1220] uppercase">
          {mode === "video" ? (
            <Video className="h-3.5 w-3.5" strokeWidth={2.5} />
          ) : (
            <Phone className="h-3.5 w-3.5" strokeWidth={2.5} />
          )}
          Incoming {mode}
        </span>

        <div className="relative mt-8">
          {!reduceMotion ? (
            <>
              <span className="absolute -inset-4 animate-ping rounded-[28px] bg-arc-purple-500/25 [animation-duration:2.2s]" />
              <span className="absolute -inset-8 rounded-[36px] border border-[#ffc928]/25" />
            </>
          ) : null}
          <div className="relative flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-[28px] bg-gradient-to-br from-[#b35cff] to-[#6b4eff] text-[3.25rem] font-extrabold shadow-[0_8px_0_#5a2a9e]">
            {initialOf(peerName)}
          </div>
        </div>

        <h1 className="mt-6 font-display text-[40px] leading-[0.95] font-bold tracking-[-0.04em]">
          {peerName}
        </h1>
        <p className="mt-2 max-w-[16rem] text-[14px] font-semibold text-white/50">
          Wants to {mode === "video" ? "see" : "talk with"} you on Arc
        </p>
        {error ? (
          <p className="mt-3 text-sm font-bold text-[#ff8a96]">{error}</p>
        ) : null}
      </motion.div>
    </div>
  );
}

function OutgoingStage({
  peerName,
  call,
  remoteLive,
  reduceMotion,
  status,
}: {
  peerName: string;
  call: CallSessionApi;
  remoteLive: boolean;
  reduceMotion: boolean;
  status: string;
}) {
  if (remoteLive) {
    return (
      <div className="relative z-10 mt-auto px-6 pb-4">
        <div className="rounded-2xl bg-[#0a0c16]/55 px-4 py-3 backdrop-blur-md ring-1 ring-white/10">
          <p className="font-display text-lg font-bold">{peerName}</p>
          <p className="text-[12px] font-bold text-[#ffc928]">{status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      >
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
          {!reduceMotion && call.uiState === "ringing_out" ? (
            <>
              <span className="absolute inset-0 animate-ping rounded-full border-2 border-[#ffc928]/40 [animation-duration:1.8s]" />
              <span className="absolute inset-[-14px] rounded-full border border-arc-purple-400/30" />
              <span className="absolute inset-[-28px] rounded-full border border-white/10" />
            </>
          ) : null}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-[#2a2048] to-[#15122a] text-[2.75rem] font-extrabold ring-2 ring-[#ffc928]/60">
            {initialOf(peerName)}
          </div>
        </div>

        <h1 className="font-display text-[34px] leading-none font-bold tracking-[-0.04em]">
          {peerName}
        </h1>
        <p
          className="mt-3 text-[13px] font-bold tracking-[0.08em] text-white/45 uppercase"
          aria-live="polite"
        >
          {status}
        </p>
        {call.error ? (
          <p className="mt-3 text-sm font-bold text-[#ff8a96]">{call.error}</p>
        ) : null}
      </motion.div>
    </div>
  );
}

function ActionPill({
  label,
  tone,
  onClick,
  icon,
  pulse,
}: {
  label: string;
  tone: "danger" | "accept";
  onClick: () => void;
  icon: ReactNode;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-1 cursor-pointer flex-col items-center gap-2 focus-visible:outline-none"
    >
      <span
        className={cn(
          "relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-[22px] text-white transition-colors duration-200",
          tone === "danger" &&
            "bg-[#ff4d5a] shadow-[0_5px_0_#c2303c] hover:bg-[#ff6570] active:translate-y-px active:shadow-none",
          tone === "accept" &&
            "bg-[#2dd4a8] shadow-[0_5px_0_#1a9e7a] hover:bg-[#3ee0b6] active:translate-y-px active:shadow-none",
        )}
      >
        {pulse ? (
          <span className="absolute inset-0 animate-ping rounded-[22px] bg-[#2dd4a8]/40 [animation-duration:1.6s]" />
        ) : null}
        <span className="relative">{icon}</span>
      </span>
      <span className="text-[12px] font-extrabold tracking-wide text-white/80">
        {label}
      </span>
    </button>
  );
}

function DockBtn({
  label,
  children,
  onClick,
  active,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]",
        active
          ? "bg-white text-[#0f1220]"
          : "bg-white/10 text-white hover:bg-white/18",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

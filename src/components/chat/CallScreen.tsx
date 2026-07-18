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
      return call.mode === "video" ? "Incoming video" : "Incoming voice";
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
 * Arlo call overlay — OLED night stage, gold/purple atmosphere.
 * Incoming: centered identity + open accept/decline rail.
 * Active: video-first with glass chrome.
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
    <div className="fixed inset-0 z-[80] mx-auto flex max-w-md flex-col overflow-hidden bg-[#05060d] font-rounded text-white">
      {/* Atmosphere — OLED + brand orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#05060d]" />
        <div className="absolute top-[-18%] left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-arc-purple-500/30 blur-[100px]" />
        <div className="absolute right-[-30%] bottom-[8%] h-72 w-72 rounded-full bg-[#ffc928]/14 blur-[90px]" />
        <div className="absolute bottom-[-10%] left-[-20%] h-64 w-64 rounded-full bg-[#6b4eff]/20 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(179,92,255,0.22),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(5,6,13,0.95)_0%,transparent_55%)]" />
        {/* Fine grain for depth */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Top chrome */}
      <header className="relative z-20 flex flex-col items-center px-5 pt-[calc(env(safe-area-inset-top)+16px)]">
        <p className="font-display text-[13px] font-bold tracking-[0.28em] text-white/40 uppercase">
          Arlo
        </p>
        {isIncoming ? (
          <motion.div
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#ffc928]/15 px-3.5 py-1.5 ring-1 ring-[#ffc928]/35"
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0.75, 1, 0.75] }
            }
            transition={
              reduceMotion
                ? undefined
                : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ffc928]" />
            <span className="text-[11px] font-extrabold tracking-[0.14em] text-[#ffc928] uppercase">
              Incoming
            </span>
          </motion.div>
        ) : !isEnded ? (
          <div className="mt-3 rounded-full bg-white/8 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white/70 ring-1 ring-white/12 backdrop-blur-md">
            {statusLabel(call)}
          </div>
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

        {remoteLive ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#05060d]/55 via-transparent to-[#05060d]/75"
          />
        ) : null}

        {isIncoming ? (
          <IncomingStage
            peerName={peerName}
            mode={call.mode}
            reduceMotion={!!reduceMotion}
            error={call.error}
          />
        ) : isEnded ? (
          <EndedStage
            peerName={peerName}
            status={statusLabel(call)}
            error={call.error}
            reduceMotion={!!reduceMotion}
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
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-4 bottom-[8.5rem] z-20 overflow-hidden rounded-[20px] shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-2 ring-[#ffc928]/55"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-[9.5rem] w-[7rem] object-cover"
            />
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-[#05060d]/80 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white/90 uppercase">
              You
            </span>
          </motion.div>
        ) : null}
      </div>

      {/* Controls */}
      <footer className="relative z-20 px-6 pb-[calc(env(safe-area-inset-bottom)+24px)]">
        {isIncoming ? (
          <div className="flex items-end justify-center gap-14">
            <ActionOrb
              label="Decline"
              tone="danger"
              onClick={() => void call.declineIncoming()}
              icon={<PhoneOff className="h-7 w-7" strokeWidth={2.25} />}
            />
            <ActionOrb
              label="Accept"
              tone="accept"
              onClick={() => void call.acceptIncoming()}
              icon={<Phone className="h-7 w-7" strokeWidth={2.25} />}
              pulse={!reduceMotion}
            />
          </div>
        ) : isEnded ? (
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={call.dismissEnded}
              className="cursor-pointer rounded-2xl bg-[#ffc928] px-10 py-3.5 text-sm font-extrabold text-[#0f1220] shadow-[0_4px_0_#c79a2e] transition-colors duration-200 hover:bg-[#ffd24d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-sm rounded-[32px] bg-white/10 px-5 py-4 ring-1 ring-white/14 backdrop-blur-2xl">
            <div className="flex items-center justify-center gap-4">
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
                className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-[#ff4d5a] text-white shadow-[0_0_0_6px_rgba(255,77,90,0.22)] transition-colors duration-200 hover:bg-[#ff6570] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
    <div className="relative flex flex-1 flex-col items-center justify-center px-6 pb-4">
      <motion.div
        className="flex w-full flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
      >
        {/* Mode chip */}
        <span className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.12em] text-white/85 ring-1 ring-white/14 uppercase backdrop-blur-md">
          {mode === "video" ? (
            <Video className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
          ) : (
            <Phone className="h-3.5 w-3.5 text-[#ffc928]" strokeWidth={2.5} />
          )}
          {mode === "video" ? "Video call" : "Voice call"}
        </span>

        {/* Avatar with ripple rings */}
        <div className="relative mb-10 flex h-44 w-44 items-center justify-center">
          {!reduceMotion ? (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border border-[#ffc928]/30"
                animate={{ scale: [1, 1.35], opacity: [0.55, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <motion.span
                className="absolute inset-[-10px] rounded-full border border-arc-purple-400/35"
                animate={{ scale: [1, 1.28], opacity: [0.45, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.45,
                }}
              />
              <motion.span
                className="absolute inset-[-22px] rounded-full border border-white/12"
                animate={{ scale: [1, 1.22], opacity: [0.35, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.9,
                }}
              />
            </>
          ) : (
            <span className="absolute inset-[-14px] rounded-full border border-[#ffc928]/25" />
          )}

          <div className="relative flex h-[8.5rem] w-[8.5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#c47dff] via-[#8b5cf6] to-[#4c2fd6] font-display text-[3.5rem] font-bold shadow-[0_20px_60px_rgba(107,78,255,0.45)] ring-[3px] ring-[#ffc928]/70">
            {initialOf(peerName)}
          </div>
        </div>

        <h1 className="max-w-[18rem] font-display text-[42px] leading-[0.92] font-bold tracking-[-0.045em] text-balance">
          {peerName}
        </h1>
        <p className="mt-3 max-w-[15rem] text-[15px] font-semibold text-white/50">
          Wants to {mode === "video" ? "see" : "talk with"} you on Arlo
        </p>
        {error ? (
          <p className="mt-4 text-sm font-bold text-[#ff8a96]">{error}</p>
        ) : null}
      </motion.div>
    </div>
  );
}

function EndedStage({
  peerName,
  status,
  error,
  reduceMotion,
}: {
  peerName: string;
  status: string;
  error: string | null;
  reduceMotion: boolean;
}) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8 flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#2a2048] to-[#12101f] font-display text-[2.75rem] font-bold ring-[3px] ring-white/20">
          {initialOf(peerName)}
        </div>
        <h1 className="font-display text-[36px] leading-none font-bold tracking-[-0.04em]">
          {peerName}
        </h1>
        <p className="mt-3 text-[13px] font-bold tracking-[0.1em] text-white/45 uppercase">
          {status}
        </p>
        {error ? (
          <p className="mt-3 max-w-xs text-sm font-bold text-[#ff8a96]">
            {error}
          </p>
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
      <div className="relative z-10 mt-auto flex justify-center px-6 pb-5">
        <div className="rounded-2xl bg-[#05060d]/60 px-5 py-3 text-center backdrop-blur-xl ring-1 ring-white/12">
          <p className="font-display text-lg font-bold tracking-[-0.02em]">
            {peerName}
          </p>
          <p className="mt-0.5 text-[12px] font-bold tracking-wide text-[#ffc928]">
            {status}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center px-6">
      <motion.div
        className="flex flex-col items-center text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        <div className="relative mb-10 flex h-40 w-40 items-center justify-center">
          {!reduceMotion && call.uiState === "ringing_out" ? (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-[#ffc928]/35"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
              <span className="absolute inset-[-16px] rounded-full border border-arc-purple-400/30" />
            </>
          ) : null}
          <div className="relative flex h-[7.5rem] w-[7.5rem] items-center justify-center rounded-full bg-gradient-to-br from-[#2a2048] to-[#12101f] font-display text-[2.75rem] font-bold ring-[3px] ring-[#ffc928]/55">
            {initialOf(peerName)}
          </div>
        </div>

        <h1 className="font-display text-[36px] leading-none font-bold tracking-[-0.04em]">
          {peerName}
        </h1>
        <p
          className="mt-3 text-[13px] font-bold tracking-[0.1em] text-white/45 uppercase"
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

function ActionOrb({
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
      className="group flex cursor-pointer flex-col items-center gap-3 focus-visible:outline-none"
    >
      <span
        className={cn(
          "relative flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full text-white transition-colors duration-200",
          tone === "danger" &&
            "bg-[#ff4d5a] shadow-[0_0_0_8px_rgba(255,77,90,0.18)] hover:bg-[#ff6570]",
          tone === "accept" &&
            "bg-[#2dd4a8] shadow-[0_0_0_8px_rgba(45,212,168,0.22)] hover:bg-[#3ee0b6]",
        )}
      >
        {pulse ? (
          <motion.span
            className="absolute inset-0 rounded-full bg-[#2dd4a8]/45"
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ) : null}
        <span className="relative">{icon}</span>
      </span>
      <span className="text-[13px] font-extrabold tracking-wide text-white/85">
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
        "flex h-14 w-14 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]",
        active
          ? "bg-white text-[#0f1220]"
          : "bg-white/12 text-white hover:bg-white/20",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      {children}
    </button>
  );
}

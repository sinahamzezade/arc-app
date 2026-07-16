"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { chatApi } from "@/lib/api/chat";
import { decryptIncomingBlob } from "@/lib/chat/e2e";
import { formatVoiceDuration } from "@/hooks/useVoiceRecorder";
import { cn } from "@/lib/utils";

/** Deterministic decorative bars from message id. */
function barsFromSeed(seed: string, count = 28): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const n = 0.28 + ((h % 1000) / 1000) * 0.72;
    out.push(n);
  }
  return out;
}

type ChatVoiceBubbleProps = {
  messageId: string;
  conversationId: string;
  attachmentId: string | null;
  attachmentMime?: string | null;
  /** Local blob URL while optimistic / pending. */
  localUrl?: string | null;
  durationMs?: number | null;
  mine: boolean;
  accessToken?: string | null;
};

/**
 * Arc voice bubble — purple sent / lavender received, play + waveform.
 */
export function ChatVoiceBubble({
  messageId,
  conversationId,
  attachmentId,
  attachmentMime,
  localUrl,
  durationMs,
  mine,
  accessToken,
}: ChatVoiceBubbleProps) {
  const [url, setUrl] = useState<string | null>(localUrl ?? null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(
    durationMs && durationMs > 0 ? durationMs / 1000 : 0,
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const revokeRef = useRef<string | null>(null);
  const bars = useMemo(() => barsFromSeed(messageId), [messageId]);

  useEffect(() => {
    if (localUrl) {
      setUrl(localUrl);
      return;
    }
    if (!attachmentId || !accessToken) return;
    let cancelled = false;
    void chatApi
      .fetchAttachmentBlob(attachmentId, accessToken)
      .then(async (blob) => {
        if (cancelled) return;
        const buf = new Uint8Array(await blob.arrayBuffer());
        const plain = await decryptIncomingBlob(
          conversationId,
          buf,
          accessToken,
        );
        const out = new Blob([new Uint8Array(plain)], {
          type: attachmentMime || blob.type || "audio/webm",
        });
        const u = URL.createObjectURL(out);
        revokeRef.current = u;
        setUrl(u);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (revokeRef.current) {
        URL.revokeObjectURL(revokeRef.current);
        revokeRef.current = null;
      }
    };
  }, [attachmentId, accessToken, localUrl, conversationId, attachmentMime]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function toggle() {
    if (!url) return;
    if (!audioRef.current) {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
      };
      audio.ontimeupdate = () => {
        const d = audio.duration;
        if (Number.isFinite(d) && d > 0) {
          setDuration(d);
          setProgress(audio.currentTime / d);
        }
      };
      audio.onloadedmetadata = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          setDuration(audio.duration);
        }
      };
    }
    const audio = audioRef.current;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  const displayMs =
    duration > 0
      ? duration * 1000
      : durationMs && durationMs > 0
        ? durationMs
        : 0;

  return (
    <div
      className={cn(
        "flex min-w-[200px] max-w-[240px] items-center gap-2.5",
        mine ? "text-white" : "text-[#0f1220]",
      )}
    >
      <button
        type="button"
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        disabled={!url}
        onClick={() => void toggle()}
        className={cn(
          "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity duration-200 disabled:opacity-40",
          mine
            ? "bg-white text-arc-purple-600 hover:bg-white/90"
            : "bg-arc-purple-600 text-white hover:bg-arc-purple-500",
        )}
      >
        {playing ? (
          <Pause className="h-4 w-4 fill-current" strokeWidth={2.5} />
        ) : (
          <Play className="ml-0.5 h-4 w-4 fill-current" strokeWidth={2.5} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className="flex h-8 items-end gap-[2px]"
          aria-hidden
          role="img"
          aria-label="Voice waveform"
        >
          {bars.map((h, i) => {
            const filled = progress > 0 && i / bars.length <= progress;
            return (
              <span
                key={i}
                className={cn(
                  "w-[2.5px] rounded-full transition-colors duration-150",
                  mine
                    ? filled
                      ? "bg-white"
                      : "bg-white/40"
                    : filled
                      ? "bg-arc-purple-600"
                      : "bg-arc-purple-400/45",
                )}
                style={{ height: `${Math.round(h * 100)}%` }}
              />
            );
          })}
        </div>
        <p
          className={cn(
            "mt-1 text-[10px] font-bold tabular-nums",
            mine ? "text-white/70" : "text-[#8a82a8]",
          )}
        >
          {displayMs > 0 ? formatVoiceDuration(displayMs) : "0:00"}
        </p>
      </div>
    </div>
  );
}

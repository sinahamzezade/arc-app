"use client";

import { useEffect, useRef } from "react";

/**
 * Simple Web Audio ringtone loop — no binary asset required.
 * Double-beep pattern every ~2.4s while `active`.
 */
export function useCallRingtone(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      void ctxRef.current?.close().catch(() => undefined);
      ctxRef.current = null;
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    void ctx.resume().catch(() => undefined);

    const beep = (at: number, freq: number, dur = 0.22) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    };

    const ringOnce = () => {
      const t = ctx.currentTime + 0.02;
      beep(t, 880);
      beep(t + 0.28, 988);
    };

    ringOnce();
    timerRef.current = setInterval(ringOnce, 2400);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      void ctx.close().catch(() => undefined);
      if (ctxRef.current === ctx) ctxRef.current = null;
    };
  }, [active]);
}

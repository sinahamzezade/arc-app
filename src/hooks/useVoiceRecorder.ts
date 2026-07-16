"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const VOICE_MAX_MS = 60_000;
export const VOICE_MIN_MS = 400;

export type VoiceRecording = {
  blob: Blob;
  mime: string;
  durationMs: number;
  filename: string;
};

type UseVoiceRecorderOpts = {
  onComplete: (rec: VoiceRecording) => void;
  onError?: (message: string) => void;
};

/**
 * MediaRecorder voice note — study-chat pattern, max 60s.
 */
export function useVoiceRecorder({ onComplete, onError }: UseVoiceRecorderOpts) {
  const [recording, setRecording] = useState(false);
  const [recordMs, setRecordMs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const autoStopRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (autoStopRef.current) {
      window.clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }
  }, []);

  const stopRecorder = useCallback(
    (send: boolean) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setRecording(false);
        cleanupStream();
        return;
      }
      const durationMs = Date.now() - startedAtRef.current;
      recorder.onstop = () => {
        setRecording(false);
        cleanupStream();
        mediaRecorderRef.current = null;
        if (!send) {
          chunksRef.current = [];
          setRecordMs(0);
          return;
        }
        if (durationMs < VOICE_MIN_MS) {
          chunksRef.current = [];
          setRecordMs(0);
          onErrorRef.current?.("Hold a bit longer");
          return;
        }
        const mime = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        setRecordMs(0);
        if (!blob.size) {
          onErrorRef.current?.("Empty recording");
          return;
        }
        onCompleteRef.current({
          blob,
          mime,
          durationMs: Math.min(durationMs, VOICE_MAX_MS),
          filename: mime.includes("mp4") ? "voice.m4a" : "voice.webm",
        });
      };
      try {
        recorder.stop();
      } catch {
        setRecording(false);
        cleanupStream();
      }
    },
    [cleanupStream],
  );

  const startRecording = useCallback(async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : undefined;
      const recorder = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined,
      );
      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setRecordMs(0);
      setRecording(true);
      recorder.start(250);
      tickRef.current = window.setInterval(() => {
        setRecordMs(Date.now() - startedAtRef.current);
      }, 200);
      autoStopRef.current = window.setTimeout(() => {
        stopRecorder(true);
      }, VOICE_MAX_MS);
    } catch {
      cleanupStream();
      setRecording(false);
      onErrorRef.current?.("Microphone permission needed");
    }
  }, [recording, cleanupStream, stopRecorder]);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    recording,
    recordMs,
    startRecording,
    stopAndSend: () => stopRecorder(true),
    cancelRecording: () => stopRecorder(false),
  };
}

export function formatVoiceDuration(ms: number) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

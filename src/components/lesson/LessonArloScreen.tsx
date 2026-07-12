"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { lessonsApi } from "@/lib/api/lessons";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { LessonShell } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

type ChatMsg = { role: "user" | "arlo"; text: string };

export default function LessonArloScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [sending, setSending] = useState(false);

  if (isLoading) {
    return (
      <LessonShell lessonId={lessonId} stepLabel="Arlo" progress={0} showArlo={false}>
        <p className="text-[#8a7cb8]">Loading Arlo…</p>
      </LessonShell>
    );
  }

  if (isError || !lesson) {
    return (
      <LessonLoadState
        message={error?.message ?? "No lesson loaded."}
        onRetry={isError ? () => refetch() : undefined}
      />
    );
  }

  const thread =
    msgs.length > 0
      ? msgs
      : [
          {
            role: "arlo" as const,
            text: `I'm locked on “${lesson.title}”. Ask for a recap, a hint, or a mini quiz.`,
          },
        ];

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const base =
      msgs.length > 0
        ? msgs
        : [
            {
              role: "arlo" as const,
              text: `I'm locked on “${lesson.title}”. Ask for a recap, a hint, or a mini quiz.`,
            },
          ];

    setMsgs([...base, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const res = await lessonsApi.arloChat(
        lessonId,
        trimmed,
        session?.accessToken,
      );
      setMsgs((prev) => [...prev, { role: "arlo", text: res.reply }]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          role: "arlo",
          text: `Couldn't reach coach just now — keep going on “${lesson.title}”.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <LessonShell
      lessonId={lesson.id}
      stepLabel="Ask Arlo"
      progress={50}
      showArlo={false}
      onBack={() => router.back()}
    >
      <div className="flex flex-1 flex-col">
        <div className="mb-3 flex items-center gap-3">
          <Image
            src={assets.arlo.wand}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <div>
            <p className="font-display text-[18px] font-bold text-[#2b1b57]">
              Arlo
            </p>
            <p className="text-[12px] font-semibold text-[#8a7cb8]">
              Lesson coach
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {lesson.suggestedArlo.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void send(prompt)}
              disabled={sending}
              className="rounded-full border border-[#ebe4f6] bg-white px-3 py-1.5 text-[12px] font-bold text-[#4a3d78] disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pb-3">
          {thread.map((msg, i) => (
            <motion.div
              key={`${msg.role}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={
                msg.role === "user"
                  ? "ml-8 rounded-2xl rounded-br-md bg-arc-purple-500 px-3.5 py-2.5 text-[14px] font-semibold text-white"
                  : "mr-8 rounded-2xl rounded-bl-md border border-[#ebe4f6] bg-white px-3.5 py-2.5 text-[14px] font-semibold text-[#2b1b57]"
              }
            >
              {msg.text}
            </motion.div>
          ))}
        </div>

        <form
          className="flex items-center gap-2 rounded-2xl border border-[#ebe4f6] bg-white p-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this lesson…"
            disabled={sending}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] font-semibold text-[#2b1b57] outline-none placeholder:text-[#b3a8d6] disabled:opacity-60"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={sending}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6] disabled:opacity-60"
          >
            <Send className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </LessonShell>
  );
}

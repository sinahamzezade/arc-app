"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { LessonShell } from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";

type ChatMsg = { role: "user" | "arlo"; text: string };

function arloReply(input: string, lessonTitle: string): string {
  const q = input.toLowerCase();
  if (q.includes("explain") || q.includes("what")) {
    return `In one line: this stop is about “${lessonTitle}”. Say it back, then practice.`;
  }
  if (q.includes("hint") || q.includes("stuck")) {
    return `Break “${lessonTitle}” into: what it is → why it matters → one tiny example.`;
  }
  if (q.includes("quiz") || q.includes("practice")) {
    return "Do practice first, then quiz. Wrong answers teach faster than perfect reading.";
  }
  return `Solid question. Keep it tied to “${lessonTitle}” — ask for a recap, a hint, or a mini quiz.`;
}

export default function LessonArloScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);

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

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMsgs((prev) => {
      const base =
        prev.length > 0
          ? prev
          : [
              {
                role: "arlo" as const,
                text: `I'm locked on “${lesson.title}”. Ask for a recap, a hint, or a mini quiz.`,
              },
            ];
      return [
        ...base,
        { role: "user", text: trimmed },
        { role: "arlo", text: arloReply(trimmed, lesson.title) },
      ];
    });
    setInput("");
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
              Lesson coach · local replies
            </p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {lesson.suggestedArlo.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => send(prompt)}
              className="rounded-full border border-[#ebe4f6] bg-white px-3 py-1.5 text-[12px] font-bold text-[#4a3d78]"
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
            send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this lesson…"
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] font-semibold text-[#2b1b57] outline-none placeholder:text-[#b3a8d6]"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6]"
          >
            <Send className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </LessonShell>
  );
}

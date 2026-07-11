"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { motion } from "motion/react";
import { assets } from "@/lib/assets";
import { getLesson } from "@/lib/lesson/mock-data";
import { LessonShell } from "./LessonShell";

type ChatMsg = { role: "user" | "arlo"; text: string };

function arloReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("head") || q.includes("body")) {
    return "Head = backstage (title, meta). Body = the show humans see. Keep props in head, actors in body.";
  }
  if (q.includes("</") || q.includes("close") || q.includes("slash")) {
    return "Closing tags wear a slash cape: </p>. Open the door, say the line, close the door. Drama avoided.";
  }
  if (q.includes("h1") || q.includes("heading")) {
    return "h1 is your billboard — one main headline. p is the fine print under it.";
  }
  return "Solid question. For this lesson: tags open, content goes in, tags close with a slash. Try the practice again if it feels fuzzy.";
}

export default function LessonArloScreen({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const lesson = getLesson(lessonId);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "arlo",
      text: lesson
        ? `I'm locked on "${lesson.title}". Ask anything about tags, head/body, or the quiz.`
        : "Lesson context missing — still happy to help with HTML basics.",
    },
  ]);

  if (!lesson) {
    return (
      <LessonShell lessonId={lessonId} stepLabel="Arlo" progress={0} showArlo={false}>
        <p className="text-[#8a7cb8]">No lesson loaded.</p>
      </LessonShell>
    );
  }

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMsgs((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "arlo", text: arloReply(trimmed) },
    ]);
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
              Lesson coach · mock replies
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
          {msgs.map((msg, i) => (
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

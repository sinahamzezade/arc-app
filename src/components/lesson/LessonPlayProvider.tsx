"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LessonPlayDto } from "@/lib/api/types";

const LessonPlayInitialContext = createContext<LessonPlayDto | undefined>(
  undefined,
);

/** Server-prefetched play DTO for the current `/learn/[lessonId]` tree. */
export function LessonPlayProvider({
  initialPlay,
  children,
}: {
  initialPlay?: LessonPlayDto;
  children: ReactNode;
}) {
  return (
    <LessonPlayInitialContext.Provider value={initialPlay}>
      {children}
    </LessonPlayInitialContext.Provider>
  );
}

export function useLessonPlayInitial(): LessonPlayDto | undefined {
  return useContext(LessonPlayInitialContext);
}

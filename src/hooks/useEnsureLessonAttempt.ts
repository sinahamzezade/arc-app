"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonPlayDto } from "@/lib/api/types";
import { useLessonStore } from "@/store/useLessonStore";

/**
 * Guarantee active attemptId for practice / quiz / reward.
 * Patches play cache so hydrate does not fight start.
 */
export function useEnsureLessonAttempt(lessonId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const attemptId = useLessonStore((s) => s.attemptId);
  const setAttemptId = useLessonStore((s) => s.setAttemptId);
  const inFlight = useRef(false);

  useEffect(() => {
    if (attemptId || !accessToken || !lessonId || inFlight.current) return;
    inFlight.current = true;
    void lessonsApi
      .start(lessonId, accessToken)
      .then((res) => {
        if (!res.attemptId) return;
        setAttemptId(res.attemptId);
        queryClient.setQueryData<LessonPlayDto>(
          ["lessons", "play", lessonId, accessToken],
          (old) => (old ? { ...old, attemptId: res.attemptId } : old),
        );
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [attemptId, accessToken, lessonId, setAttemptId, queryClient]);

  return attemptId;
}

"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { lessonsApi } from "@/lib/api/lessons";
import {
  mapPlayDtoToLesson,
  type PlayableLesson,
} from "@/lib/lesson/map-play";
import { useLessonStore } from "@/store/useLessonStore";

export type UsePlayableLessonResult = {
  lesson: PlayableLesson | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/** Load authoritative play payload from backend. Hydrates session store once. */
export function usePlayableLesson(lessonId: string): UsePlayableLessonResult {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken;
  const hydrateFromProgress = useLessonStore((s) => s.hydrateFromProgress);

  const query = useQuery({
    queryKey: ["lessons", "play", lessonId, accessToken ?? "anon"],
    enabled:
      status === "authenticated" &&
      Boolean(accessToken) &&
      Boolean(lessonId) &&
      isUuid(lessonId),
    queryFn: () => lessonsApi.getPlay(lessonId, accessToken),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data) return;
    hydrateFromProgress(lessonId, {
      contentStep: query.data.progress.contentStep,
      practiceOptionId: null,
      quizAnswers: query.data.progress.quizAnswers ?? {},
      quizIndex: query.data.progress.quizIndex ?? 0,
      completed: query.data.progress.status === "completed",
    });
  }, [query.data, lessonId, hydrateFromProgress]);

  const lesson = query.data ? mapPlayDtoToLesson(query.data) : null;

  return {
    lesson,
    isLoading:
      status === "loading" ||
      (status === "authenticated" && query.isLoading),
    isError: query.isError || (status === "unauthenticated" && isUuid(lessonId)),
    error: (query.error as Error | null) ?? null,
    refetch: () => {
      void query.refetch();
    },
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

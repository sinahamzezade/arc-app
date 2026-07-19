"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { lessonsApi } from "@/lib/api/lessons";
import type { LessonPlayDto } from "@/lib/api/types";
import {
  mapPlayDtoToLesson,
  type PlayableLesson,
} from "@/lib/lesson/map-play";
import { playQueryKey } from "@/lib/lesson/play-query-key";
import { useLessonStore } from "@/store/useLessonStore";
import { useLessonPlayInitial } from "@/components/lesson/LessonPlayProvider";

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
  const userId = session?.user?.id;
  const hydrateFromProgress = useLessonStore((s) => s.hydrateFromProgress);
  const layoutInitial = useLessonPlayInitial();
  const initialData: LessonPlayDto | undefined =
    layoutInitial?.id === lessonId ? layoutInitial : undefined;

  const query = useQuery({
    queryKey: playQueryKey(lessonId, userId),
    enabled:
      status === "authenticated" &&
      Boolean(accessToken) &&
      Boolean(lessonId) &&
      isUuid(lessonId),
    queryFn: () => lessonsApi.getPlay(lessonId, accessToken),
    initialData,
    staleTime: 30_000,
  });

  // Hydrate once per lesson — focus/interval refetches must not reset
  // local step position to the (possibly lagging) server value.
  const hydratedLessonRef = useRef<string | null>(null);
  useEffect(() => {
    if (!query.data) return;
    if (hydratedLessonRef.current === lessonId) return;
    hydratedLessonRef.current = lessonId;
    hydrateFromProgress(lessonId, {
      contentStep: query.data.progress.contentStep,
      practiceDone: query.data.progress.practiceDone ?? false,
      quizAnswers: query.data.progress.quizAnswers ?? {},
      quizIndex: query.data.progress.quizIndex ?? 0,
      completed: query.data.progress.status === "completed",
      attemptId: query.data.attemptId ?? null,
    });
  }, [query.data, lessonId, hydrateFromProgress]);

  const lesson = useMemo(
    () => (query.data ? mapPlayDtoToLesson(query.data) : null),
    [query.data],
  );

  return {
    lesson,
    isLoading:
      !query.data &&
      (status === "loading" ||
        (status === "authenticated" && query.isLoading)),
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

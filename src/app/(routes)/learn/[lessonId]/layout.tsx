import type { ReactNode } from "react";
import { auth } from "@/auth";
import { LessonPlayProvider } from "@/components/lesson/LessonPlayProvider";
import { tryServerApiFetch } from "@/lib/api/server";
import type { LessonPlayDto } from "@/lib/api/types";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ lessonId: string }>;
};

/**
 * Prefetch play payload on the server so client hooks hydrate without a
 * session → GET /play waterfall (leaderboard-style initialData).
 */
export default async function LessonIdLayout({ children, params }: LayoutProps) {
  const { lessonId } = await params;
  const session = await auth();
  const initialPlay =
    session?.accessToken && lessonId
      ? await tryServerApiFetch<LessonPlayDto>(
          `/lessons/${lessonId}/play`,
          session.accessToken,
        )
      : undefined;

  return (
    <LessonPlayProvider initialPlay={initialPlay}>{children}</LessonPlayProvider>
  );
}

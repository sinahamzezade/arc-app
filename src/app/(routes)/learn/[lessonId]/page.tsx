import { redirect } from "next/navigation";
import LessonOverviewScreen from "@/components/lesson/LessonOverviewScreen";
import { getLesson } from "@/lib/lesson/mock-data";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonOverviewPage({ params }: PageProps) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) {
    redirect("/path");
  }
  return <LessonOverviewScreen lessonId={lessonId} />;
}

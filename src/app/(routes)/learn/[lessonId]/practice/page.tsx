import { redirect } from "next/navigation";
import LessonPracticeScreen from "@/components/lesson/LessonPracticeScreen";
import { getLesson } from "@/lib/lesson/mock-data";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonPracticePage({ params }: PageProps) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) redirect("/path");
  return <LessonPracticeScreen lessonId={lessonId} />;
}

import { redirect } from "next/navigation";
import LessonQuizScreen from "@/components/lesson/LessonQuizScreen";
import { getLesson } from "@/lib/lesson/mock-data";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonQuizPage({ params }: PageProps) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) redirect("/path");
  return <LessonQuizScreen lessonId={lessonId} />;
}

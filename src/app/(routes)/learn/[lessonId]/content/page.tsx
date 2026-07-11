import { redirect } from "next/navigation";
import LessonContentScreen from "@/components/lesson/LessonContentScreen";
import { getLesson } from "@/lib/lesson/mock-data";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonContentPage({ params }: PageProps) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) redirect("/path");
  return <LessonContentScreen lessonId={lessonId} />;
}

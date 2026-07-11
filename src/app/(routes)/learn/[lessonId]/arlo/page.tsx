import { redirect } from "next/navigation";
import LessonArloScreen from "@/components/lesson/LessonArloScreen";
import { getLesson } from "@/lib/lesson/mock-data";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonArloPage({ params }: PageProps) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) redirect("/path");
  return <LessonArloScreen lessonId={lessonId} />;
}

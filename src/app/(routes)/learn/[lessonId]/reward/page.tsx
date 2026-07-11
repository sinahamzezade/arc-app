import { redirect } from "next/navigation";
import LessonRewardScreen from "@/components/lesson/LessonRewardScreen";
import { getLesson } from "@/lib/lesson/mock-data";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonRewardPage({ params }: PageProps) {
  const { lessonId } = await params;
  if (!getLesson(lessonId)) redirect("/path");
  return <LessonRewardScreen lessonId={lessonId} />;
}

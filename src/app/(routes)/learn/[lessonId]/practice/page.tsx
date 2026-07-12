import LessonPracticeScreen from "@/components/lesson/LessonPracticeScreen";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonPracticePage({ params }: PageProps) {
  const { lessonId } = await params;
  return <LessonPracticeScreen lessonId={lessonId} />;
}

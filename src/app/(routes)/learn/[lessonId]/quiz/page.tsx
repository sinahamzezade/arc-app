import LessonQuizScreen from "@/components/lesson/LessonQuizScreen";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonQuizPage({ params }: PageProps) {
  const { lessonId } = await params;
  return <LessonQuizScreen lessonId={lessonId} />;
}

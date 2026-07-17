import LessonActiveBlockScreen from "@/components/lesson/LessonActiveBlockScreen";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonActivePage({ params }: PageProps) {
  const { lessonId } = await params;
  return <LessonActiveBlockScreen lessonId={lessonId} />;
}

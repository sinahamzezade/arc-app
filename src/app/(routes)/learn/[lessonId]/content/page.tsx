import LessonContentScreen from "@/components/lesson/LessonContentScreen";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonContentPage({ params }: PageProps) {
  const { lessonId } = await params;
  return <LessonContentScreen lessonId={lessonId} />;
}

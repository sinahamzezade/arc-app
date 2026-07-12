import LessonArloScreen from "@/components/lesson/LessonArloScreen";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonArloPage({ params }: PageProps) {
  const { lessonId } = await params;
  return <LessonArloScreen lessonId={lessonId} />;
}

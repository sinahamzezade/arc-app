import LessonRewardScreen from "@/components/lesson/LessonRewardScreen";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

export default async function LessonRewardPage({ params }: PageProps) {
  const { lessonId } = await params;
  return <LessonRewardScreen lessonId={lessonId} />;
}

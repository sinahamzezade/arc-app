import LessonOverviewScreen from "@/components/lesson/LessonOverviewScreen";

type PageProps = {
  params: Promise<{ lessonId: string }>;
};

/** Overview — client loads play payload from backend. */
export default async function LessonOverviewPage({ params }: PageProps) {
  const { lessonId } = await params;
  return <LessonOverviewScreen lessonId={lessonId} />;
}

import { auth } from "@/auth";
import GraduationScreen from "@/components/path/GraduationScreen";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ roadmapId?: string }>;
};

export default async function PathGraduationPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/login");
  }
  const { roadmapId } = await searchParams;
  if (!roadmapId) {
    redirect("/path");
  }
  return <GraduationScreen roadmapId={roadmapId} />;
}

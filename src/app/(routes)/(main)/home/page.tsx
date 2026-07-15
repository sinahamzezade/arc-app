import { auth } from "@/auth";
import HomeScreen from "@/components/HomeScreen";
import { tryServerApiFetch } from "@/lib/api/server";
import type {
  RoadmapCurrentResponse,
  WeekCurrentResponse,
} from "@/lib/api/types";
import { isQuestionnaireComplete } from "@/lib/auth/post-auth-route";
import { emptyHomeData } from "@/lib/home/types";

export default async function HomePage() {
  const session = await auth();
  const accessToken = session?.accessToken;
  const [initialRoadmap, initialWeek] = accessToken
    ? await Promise.all([
        tryServerApiFetch<RoadmapCurrentResponse>(
          "/roadmaps/current",
          accessToken,
        ),
        tryServerApiFetch<WeekCurrentResponse>("/weeks/current", accessToken),
      ])
    : [undefined, undefined];
  const profile = session?.profile;
  const base = emptyHomeData();
  const data = emptyHomeData({
    userName:
      profile?.displayName || profile?.username || session?.user?.name || "",
    stats: {
      ...base.stats,
      xp: profile?.totalXp ?? 0,
      coins: profile?.coins ?? 0,
      gems: profile?.gems ?? 0,
    },
    weeklyStreak: {
      ...base.weeklyStreak,
      weeks: profile?.weeklyStreak ?? 0,
    },
  });

  return (
    <HomeScreen
      data={data}
      initialRoadmap={initialRoadmap}
      initialWeek={initialWeek}
      questionnaireComplete={isQuestionnaireComplete(profile ?? null)}
    />
  );
}

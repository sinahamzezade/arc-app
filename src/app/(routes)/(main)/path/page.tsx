import { auth } from "@/auth";
import PathScreen from "@/components/PathScreen";
import { tryServerApiFetch } from "@/lib/api/server";
import type { RoadmapCurrentResponse } from "@/lib/api/types";

export default async function PathPage() {
  const session = await auth();
  const initialRoadmap = session?.accessToken
    ? await tryServerApiFetch<RoadmapCurrentResponse>(
        "/roadmaps/current",
        session.accessToken,
      )
    : undefined;

  return <PathScreen initialRoadmap={initialRoadmap} />;
}

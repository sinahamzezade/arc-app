import { notFound } from "next/navigation";
import LeaguePeerProfileScreen from "@/components/LeaguePeerProfileScreen";
import { getLeaguePeerProfile } from "@/lib/leaderboard/mock-data";

export default async function LeaguePeerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const peer = getLeaguePeerProfile(id);
  if (!peer) notFound();
  return <LeaguePeerProfileScreen peer={peer} />;
}

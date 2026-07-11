import { Suspense } from "react";
import BattleInviteScreen from "@/components/battle/BattleInviteScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BattleInvitePage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <BattleInviteScreen inviteId={id} />
    </Suspense>
  );
}

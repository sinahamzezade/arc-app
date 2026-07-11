import BattlePlayScreen from "@/components/battle/BattlePlayScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BattlePlayPage({ params }: PageProps) {
  const { id } = await params;
  return <BattlePlayScreen battleId={id} />;
}

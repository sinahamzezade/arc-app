import BattleResultScreen from "@/components/battle/BattleResultScreen";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BattleResultPage({ params }: PageProps) {
  const { id } = await params;
  return <BattleResultScreen battleId={id} />;
}

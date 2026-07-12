import { Suspense } from "react";
import BattleHubScreen from "@/components/battle/BattleHubScreen";

export default function BattlePage() {
  return (
    <Suspense fallback={null}>
      <BattleHubScreen />
    </Suspense>
  );
}

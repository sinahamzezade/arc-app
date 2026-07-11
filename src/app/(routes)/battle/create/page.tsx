import { Suspense } from "react";
import BattleCreateScreen from "@/components/battle/BattleCreateScreen";

export default function BattleCreatePage() {
  return (
    <Suspense fallback={null}>
      <BattleCreateScreen />
    </Suspense>
  );
}

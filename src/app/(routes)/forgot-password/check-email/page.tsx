import { Suspense } from "react";
import CheckEmailScreen from "@/components/CheckEmailScreen";

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailScreen />
    </Suspense>
  );
}

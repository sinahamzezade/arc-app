import { Suspense } from "react";
import OtpScreen from "@/components/OtpScreen";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <OtpScreen />
    </Suspense>
  );
}

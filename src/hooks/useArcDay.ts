"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { meApi } from "@/lib/api/auth";
import { arcDayNumber } from "@/lib/profile/arc-day";

/**
 * Days since Arc start — prefer onboarding/questionnaire stamp, else user.createdAt.
 */
export function useArcDay(fallback: number) {
  const { data: session } = useSession();
  const fromProfile = useMemo(() => {
    const iso =
      session?.profile?.onboardingCompletedAt ||
      session?.profile?.questionnaireCompletedAt;
    return arcDayNumber(iso);
  }, [
    session?.profile?.onboardingCompletedAt,
    session?.profile?.questionnaireCompletedAt,
  ]);

  const [fromUser, setFromUser] = useState<number | null>(null);

  useEffect(() => {
    if (fromProfile != null) return;
    let cancelled = false;
    void meApi
      .get()
      .then((me) => {
        if (cancelled) return;
        setFromUser(arcDayNumber(me.user.createdAt));
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [fromProfile]);

  return fromProfile ?? fromUser ?? fallback;
}

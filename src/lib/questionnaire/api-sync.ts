"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  emptyQuestionnaireAnswers,
  isScheduleAnswer,
  type QuestionnaireAnswers,
} from "@/schemas/questionnaire";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { questionnaireApi } from "@/lib/api/questionnaire";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";

function mergeAnswers(
  incoming: Partial<QuestionnaireAnswers> | null | undefined,
  schemaSteps?: { id: string; uiKind?: string; selection?: string }[],
): QuestionnaireAnswers {
  const base = emptyQuestionnaireAnswers(schemaSteps);
  if (!incoming) return base;
  const merged: QuestionnaireAnswers = { ...base, ...incoming };
  for (const [key, value] of Object.entries(incoming)) {
    if (isScheduleAnswer(value)) {
      merged[key] = {
        days: value.days ?? [],
        times: value.times ?? [],
      };
    }
  }
  for (const step of schemaSteps ?? []) {
    if (step.uiKind === "schedule" && !isScheduleAnswer(merged[step.id])) {
      merged[step.id] = { days: [], times: [] };
    }
  }
  return merged;
}

/** Load schema + hydrate answers from backend (waits for Auth.js access token). */
export function useHydrateQuestionnaire() {
  const { data: session, status } = useSession();
  const hydrated = useQuestionnaireStore((s) => s.hydrated);
  const schema = useQuestionnaireStore((s) => s.schema);
  const reset = useQuestionnaireStore((s) => s.reset);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const qStatus = session?.profile?.questionnaireStatus;
  const prevQStatusRef = useRef<string | null | undefined>(undefined);
  /** Prevents re-fetch storms when schema/hydrated flip mid-flight. */
  const inFlightTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevQStatusRef.current;
    prevQStatusRef.current = qStatus;
    if (prev === "completed" && qStatus !== "completed") {
      inFlightTokenRef.current = null;
      reset();
    }
  }, [qStatus, reset]);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status !== "authenticated" || !session?.accessToken) {
      setLoading(false);
      setError("Sign in to continue");
      return;
    }

    if (hydrated && schema) {
      setLoading(false);
      setError(null);
      return;
    }

    const token = session.accessToken;
    if (inFlightTokenRef.current === token) {
      return;
    }
    inFlightTokenRef.current = token;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const [schemaRes, answersRes] = await Promise.all([
          questionnaireApi.getSchema(token),
          questionnaireApi.get(token),
        ]);
        if (cancelled) return;
        // Atomic write — avoids setSchema→re-render→re-fetch before hydrated.
        useQuestionnaireStore.setState({
          schema: schemaRes,
          answers: answersRes.answers
            ? mergeAnswers(answersRes.answers, schemaRes.steps)
            : emptyQuestionnaireAnswers(schemaRes.steps),
          hydrated: true,
        });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        inFlightTokenRef.current = null;
        if (err instanceof ApiError) {
          setError(messageForCode(err.code, err.message));
        } else {
          setError("Could not load questionnaire");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.accessToken, hydrated, schema, qStatus]);

  return { loading, error, hydrated, schema, status };
}

/** Persist full answer snapshot as draft. */
export async function saveQuestionnaireDraft(
  answers: QuestionnaireAnswers,
  accessToken?: string | null,
): Promise<void> {
  await questionnaireApi.saveDraft(answers, accessToken);
}

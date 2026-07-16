"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const qStatus = session?.profile?.questionnaireStatus;
  const prevQStatusRef = useRef<string | null | undefined>(undefined);
  const fetchGenRef = useRef(0);
  // Token refresh must NOT restart hydrate — it was aborting in-flight
  // schema+answers and leaving Form CTA on "Loading form…" forever.
  const accessTokenRef = useRef<string | null | undefined>(session?.accessToken);
  accessTokenRef.current = session?.accessToken;

  useEffect(() => {
    const prev = prevQStatusRef.current;
    prevQStatusRef.current = qStatus;
    if (prev === "completed" && qStatus !== "completed") {
      fetchGenRef.current += 1;
      reset();
      setAttempt((n) => n + 1);
    }
  }, [qStatus, reset]);

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated" || !accessTokenRef.current) {
      setError("Sign in to continue");
      return;
    }

    if (schema) {
      setError(null);
      return;
    }

    const gen = ++fetchGenRef.current;
    const token = accessTokenRef.current;
    setError(null);

    void (async () => {
      try {
        const [schemaRes, answersRes] = await Promise.all([
          questionnaireApi.getSchema(token),
          questionnaireApi.get(token),
        ]);
        if (gen !== fetchGenRef.current) return;
        useQuestionnaireStore.setState({
          schema: schemaRes,
          answers: answersRes.answers
            ? mergeAnswers(answersRes.answers, schemaRes.steps)
            : emptyQuestionnaireAnswers(schemaRes.steps),
          hydrated: true,
        });
        setError(null);
      } catch (err) {
        if (gen !== fetchGenRef.current) return;
        const latest = accessTokenRef.current;
        if (latest && latest !== token) {
          try {
            const [schemaRes, answersRes] = await Promise.all([
              questionnaireApi.getSchema(latest),
              questionnaireApi.get(latest),
            ]);
            if (gen !== fetchGenRef.current) return;
            useQuestionnaireStore.setState({
              schema: schemaRes,
              answers: answersRes.answers
                ? mergeAnswers(answersRes.answers, schemaRes.steps)
                : emptyQuestionnaireAnswers(schemaRes.steps),
              hydrated: true,
            });
            setError(null);
            return;
          } catch (retryErr) {
            err = retryErr;
          }
        }
        if (err instanceof ApiError) {
          setError(messageForCode(err.code, err.message));
        } else {
          setError("Could not load questionnaire");
        }
      }
    })();
    // Intentionally omit accessToken — refresh was restarting this effect
    // and abandoning in-flight schema loads before they could commit.
  }, [status, schema, attempt]);

  const retry = useCallback(() => {
    fetchGenRef.current += 1;
    setError(null);
    useQuestionnaireStore.setState({ schema: null, hydrated: false });
    setAttempt((n) => n + 1);
  }, []);

  const loading =
    status === "loading" ||
    (status === "authenticated" &&
      Boolean(session?.accessToken) &&
      !schema &&
      !error);

  return { loading, error, hydrated, schema, status, retry };
}

/** Persist full answer snapshot as draft. */
export async function saveQuestionnaireDraft(
  answers: QuestionnaireAnswers,
  accessToken?: string | null,
): Promise<void> {
  await questionnaireApi.saveDraft(answers, accessToken);
}

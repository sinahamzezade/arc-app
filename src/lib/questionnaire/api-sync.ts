"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  emptyQuestionnaireAnswers,
  type QuestionnaireAnswers,
} from "@/schemas/questionnaire";
import { ApiError, messageForCode } from "@/lib/api/errors";
import { questionnaireApi } from "@/lib/api/questionnaire";
import { useQuestionnaireStore } from "@/store/useQuestionnaireStore";

function mergeAnswers(
  incoming: Partial<QuestionnaireAnswers> | null | undefined,
): QuestionnaireAnswers {
  if (!incoming) return emptyQuestionnaireAnswers;
  return {
    ...emptyQuestionnaireAnswers,
    ...incoming,
    schedule: {
      days: incoming.schedule?.days ?? [],
      times: incoming.schedule?.times ?? [],
    },
  };
}

/** Load schema + hydrate answers from backend (waits for Auth.js access token). */
export function useHydrateQuestionnaire() {
  const { data: session, status } = useSession();
  const hydrated = useQuestionnaireStore((s) => s.hydrated);
  const schema = useQuestionnaireStore((s) => s.schema);
  const replaceAnswers = useQuestionnaireStore((s) => s.replaceAnswers);
  const setSchema = useQuestionnaireStore((s) => s.setSchema);
  const setHydrated = useQuestionnaireStore((s) => s.setHydrated);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    let cancelled = false;
    const token = session.accessToken;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [schemaRes, answersRes] = await Promise.all([
          questionnaireApi.getSchema(token),
          questionnaireApi.get(token),
        ]);
        if (cancelled) return;
        setSchema(schemaRes);
        if (answersRes.answers) {
          replaceAnswers(mergeAnswers(answersRes.answers));
        } else {
          setHydrated(true);
        }
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError) {
          setError(messageForCode(err.code, err.message));
        } else {
          setError("Could not load questionnaire");
        }
        // Allow retry; do not fake hydrated without schema
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    status,
    session?.accessToken,
    hydrated,
    schema,
    replaceAnswers,
    setSchema,
    setHydrated,
  ]);

  return { loading, error, hydrated, schema, status };
}

/** Persist full answer snapshot as draft. */
export async function saveQuestionnaireDraft(
  answers: QuestionnaireAnswers,
  accessToken?: string | null,
): Promise<void> {
  await questionnaireApi.saveDraft(answers, accessToken);
}

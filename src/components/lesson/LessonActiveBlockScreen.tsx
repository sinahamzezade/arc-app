"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Compass,
  Eye,
  FlaskConical,
  MessageSquare,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { lessonsApi } from "@/lib/api/lessons";
import type {
  LessonActiveBlockDto,
  LessonCheckActiveBlockResponse,
} from "@/lib/api/types";
import { InlineMarkdown } from "@/lib/lesson/inline-markdown";
import {
  finishHrefFor,
  finishLabelFor,
  startSegmentFor,
} from "@/lib/lesson/map-play";
import { useEnsureLessonAttempt } from "@/hooks/useEnsureLessonAttempt";
import { usePlayableLesson } from "@/hooks/usePlayableLesson";
import { useLessonStore } from "@/store/useLessonStore";
import {
  LessonOptionCard,
  LessonPrimaryButton,
  LessonShell,
} from "./LessonShell";
import { LessonLoadState } from "./LessonLoadState";
import { ReadingArloAssist } from "./ReadingArloAssist";

type BlockReveal = LessonCheckActiveBlockResponse & { attempted: true };

const GRADEABLE_TYPES = new Set([
  "scenario_decision",
  "visual_hotspot",
  "drag_order",
  "debate_pick",
  "sandbox_simulation",
]);

function isGradeable(block: LessonActiveBlockDto): boolean {
  return GRADEABLE_TYPES.has(block.type);
}

function blockKey(block: LessonActiveBlockDto, index: number): string {
  if ("id" in block && block.id) return block.id;
  return `${block.type}-${index}`;
}

function formatActionLabel(action: string): string {
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LessonActiveBlockScreen({
  lessonId,
}: {
  lessonId: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const { lesson, isLoading, isError, error, refetch } =
    usePlayableLesson(lessonId);
  const attemptId = useEnsureLessonAttempt(lessonId);

  const [reveals, setReveals] = useState<Record<string, BlockReveal>>({});
  const [scenarioPick, setScenarioPick] = useState<Record<string, string>>({});
  const [hotspotPick, setHotspotPick] = useState<Record<string, string>>({});
  const [debatePick, setDebatePick] = useState<Record<string, "a" | "b">>({});
  const [dragOrder, setDragOrder] = useState<Record<string, string[]>>({});
  const [sandboxActions, setSandboxActions] = useState<
    Record<string, string[]>
  >({});
  const [checkingBlockId, setCheckingBlockId] = useState<string | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);

  const wrongSegment = lesson && lesson.body.kind !== "active";
  useEffect(() => {
    if (!lesson || !wrongSegment) return;
    router.replace(`/learn/${lesson.id}/${startSegmentFor(lesson.lessonType)}`);
  }, [lesson, wrongSegment, router]);

  const checkMutation = useMutation({
    mutationFn: async (payload: {
      blockId: string;
      fn: () => Promise<LessonCheckActiveBlockResponse>;
    }) => {
      const id = useLessonStore.getState().attemptId;
      if (!id) throw new Error("Start the lesson first");
      setCheckingBlockId(payload.blockId);
      setCheckError(null);
      return payload.fn();
    },
    onSuccess: (res) => {
      setReveals((prev) => ({
        ...prev,
        [res.blockId]: { ...res, attempted: true },
      }));
      setCheckingBlockId(null);
    },
    onError: (err) => {
      setCheckingBlockId(null);
      setCheckError(
        err instanceof Error ? err.message : "Check failed. Retry.",
      );
    },
  });

  const onScenarioPick = useCallback((blockId: string, id: string) => {
    setScenarioPick((s) => ({ ...s, [blockId]: id }));
  }, []);

  const onHotspotPick = useCallback((blockId: string, id: string) => {
    setHotspotPick((s) => ({ ...s, [blockId]: id }));
  }, []);

  const onDebatePick = useCallback((blockId: string, side: "a" | "b") => {
    setDebatePick((s) => ({ ...s, [blockId]: side }));
  }, []);

  const onDragReorder = useCallback((blockId: string, ids: string[]) => {
    setDragOrder((s) => ({ ...s, [blockId]: ids }));
  }, []);

  const onSandboxToggle = useCallback((blockId: string, action: string) => {
    setSandboxActions((s) => {
      const cur = s[blockId] ?? [];
      const next = cur.includes(action)
        ? cur.filter((a) => a !== action)
        : [...cur, action];
      return { ...s, [blockId]: next };
    });
  }, []);

  const onCheckBlock = useCallback(
    (block: LessonActiveBlockDto, blockId: string) => {
      if (!attemptId) return;
      if (reveals[blockId]) return;
      const token = session?.accessToken;

      switch (block.type) {
        case "scenario_decision": {
          const optionId = scenarioPick[blockId];
          if (!optionId) return;
          checkMutation.mutate({
            blockId,
            fn: () =>
              lessonsApi.checkScenario(
                lessonId,
                blockId,
                { attemptId, optionId },
                token,
              ),
          });
          break;
        }
        case "visual_hotspot": {
          const hotspotId = hotspotPick[blockId];
          if (!hotspotId) return;
          checkMutation.mutate({
            blockId,
            fn: () =>
              lessonsApi.checkVisualHotspot(
                lessonId,
                blockId,
                { attemptId, hotspotId },
                token,
              ),
          });
          break;
        }
        case "drag_order": {
          const ordered =
            dragOrder[blockId] ?? block.items.map((i) => i.id);
          checkMutation.mutate({
            blockId,
            fn: () =>
              lessonsApi.checkDragOrder(
                lessonId,
                blockId,
                { attemptId, orderedIds: ordered },
                token,
              ),
          });
          break;
        }
        case "debate_pick": {
          const side = debatePick[blockId];
          if (!side) return;
          checkMutation.mutate({
            blockId,
            fn: () =>
              lessonsApi.checkDebate(
                lessonId,
                blockId,
                { attemptId, side },
                token,
              ),
          });
          break;
        }
        case "sandbox_simulation": {
          const actions = sandboxActions[blockId] ?? [];
          if (actions.length === 0) return;
          checkMutation.mutate({
            blockId,
            fn: () =>
              lessonsApi.checkSandboxSimulation(
                lessonId,
                blockId,
                { attemptId, actions },
                token,
              ),
          });
          break;
        }
      }
    },
    [
      attemptId,
      checkMutation,
      debatePick,
      dragOrder,
      hotspotPick,
      lessonId,
      reveals,
      sandboxActions,
      scenarioPick,
      session?.accessToken,
    ],
  );

  if (isLoading || wrongSegment) {
    return (
      <LessonShell
        lessonId={lessonId}
        stepLabel="Loading"
        progress={0}
        showArlo={false}
      >
        <p className="text-arc-lavender-600">Loading activity…</p>
      </LessonShell>
    );
  }

  if (isError || !lesson) {
    return (
      <LessonLoadState
        message={error?.message ?? "Lesson not found."}
        onRetry={isError ? () => refetch() : undefined}
      />
    );
  }

  const body = lesson.body;
  if (body.kind !== "active") return null;

  const blocks = body.blocks;
  const gradeableIds = blocks
    .filter(isGradeable)
    .map((b, i) => blockKey(b, i));
  const resolvedCount = gradeableIds.filter((id) => reveals[id]).length;
  const allResolved =
    gradeableIds.length === 0 || resolvedCount >= gradeableIds.length;
  const progress =
    gradeableIds.length > 0
      ? 10 + (resolvedCount / gradeableIds.length) * 80
      : 90;

  return (
    <LessonShell
      lessonId={lesson.id}
      lessonType={lesson.lessonType}
      stepLabel="Active lesson"
      progress={progress}
      onBack={() => router.push(`/learn/${lesson.id}`)}
    >
      <div className="flex flex-1 flex-col">
        <h1 className="font-display text-[24px] leading-tight font-bold tracking-[-0.03em] text-[#2b1b57]">
          {lesson.title}
        </h1>
        {body.objective ? (
          <p className="mt-2 text-[14px] font-semibold text-[#4a3d78]">
            <InlineMarkdown text={body.objective} />
          </p>
        ) : null}

        <div className="mt-5 space-y-6">
          {blocks.map((block, index) => {
            const id = blockKey(block, index);
            return (
              <ActiveBlockView
                key={id}
                block={block}
                blockId={id}
                reveal={reveals[id]}
                checking={checkingBlockId === id}
                scenarioPick={scenarioPick[id]}
                hotspotPick={hotspotPick[id]}
                debatePick={debatePick[id]}
                dragIds={
                  dragOrder[id] ??
                  (block.type === "drag_order"
                    ? block.items.map((i) => i.id)
                    : [])
                }
                sandboxSelected={sandboxActions[id] ?? []}
                onScenarioPick={onScenarioPick}
                onHotspotPick={onHotspotPick}
                onDebatePick={onDebatePick}
                onDragReorder={onDragReorder}
                onSandboxToggle={onSandboxToggle}
                onCheck={onCheckBlock}
              />
            );
          })}
        </div>

        <ReadingArloAssist
          lessonId={lesson.id}
          lessonType={lesson.lessonType}
          focusTitle={lesson.title}
        />

        {checkError ? (
          <p className="mt-4 text-[13px] font-bold text-[#9a4a12]">
            {checkError}
          </p>
        ) : null}

        <div className="mt-auto space-y-2 pt-8">
          {allResolved ? (
            <LessonPrimaryButton href={finishHrefFor(lesson)}>
              {finishLabelFor(lesson)}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </LessonPrimaryButton>
          ) : (
            <p className="text-center text-[13px] font-bold text-[#4a3d78]">
              Complete each interactive block to continue
            </p>
          )}
        </div>
      </div>
    </LessonShell>
  );
}

const ActiveBlockView = memo(function ActiveBlockView({
  block,
  blockId,
  reveal,
  checking,
  scenarioPick,
  hotspotPick,
  debatePick,
  dragIds,
  sandboxSelected,
  onScenarioPick,
  onHotspotPick,
  onDebatePick,
  onDragReorder,
  onSandboxToggle,
  onCheck,
}: {
  block: LessonActiveBlockDto;
  blockId: string;
  reveal?: BlockReveal;
  checking: boolean;
  scenarioPick?: string;
  hotspotPick?: string;
  debatePick?: "a" | "b";
  dragIds: string[];
  sandboxSelected: string[];
  onScenarioPick: (blockId: string, id: string) => void;
  onHotspotPick: (blockId: string, id: string) => void;
  onDebatePick: (blockId: string, side: "a" | "b") => void;
  onDragReorder: (blockId: string, ids: string[]) => void;
  onSandboxToggle: (blockId: string, action: string) => void;
  onCheck: (block: LessonActiveBlockDto, blockId: string) => void;
}) {
  const revealed = Boolean(reveal);

  if (block.type === "text") {
    return (
      <p className="text-[15px] leading-relaxed font-medium text-[#2b1b57]">
        <InlineMarkdown text={block.body} />
      </p>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="rounded-[16px] border border-arc-purple-200 bg-white px-4 py-3 shadow-[0_2px_0_rgba(107,78,255,0.08)]">
        <p className="text-[12px] font-black tracking-[0.08em] text-arc-purple-600 uppercase">
          {block.title}
        </p>
        <p className="mt-1.5 text-[14px] font-semibold text-[#2b1b57]">
          <InlineMarkdown text={block.body} />
        </p>
      </div>
    );
  }

  if (block.type === "live_context") {
    const snippet = block.snippet;
    if (!snippet) return null;
    return (
      <div className="rounded-[16px] border border-[#ffc928]/40 bg-[#fff8e6] px-4 py-3">
        <p className="text-[10px] font-black tracking-[0.12em] text-[#9a7a12] uppercase">
          Live context
        </p>
        <p className="mt-1 font-display text-[16px] font-bold text-[#2b1b57]">
          {snippet.headline}
        </p>
        <p className="mt-1.5 text-[14px] font-semibold text-[#4a3d78]">
          <InlineMarkdown text={snippet.body} />
        </p>
        {snippet.sourceUrl ? (
          <a
            href={snippet.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-[12px] font-bold text-arc-purple-600 underline"
          >
            Source
          </a>
        ) : null}
      </div>
    );
  }

  const icon =
    block.type === "scenario_decision" ? (
      <Compass className="h-4 w-4" strokeWidth={2.25} />
    ) : block.type === "visual_hotspot" ? (
      <Eye className="h-4 w-4" strokeWidth={2.25} />
    ) : block.type === "debate_pick" ? (
      <MessageSquare className="h-4 w-4" strokeWidth={2.25} />
    ) : (
      <FlaskConical className="h-4 w-4" strokeWidth={2.25} />
    );

  const canCheck = (() => {
    if (revealed) return false;
    switch (block.type) {
      case "scenario_decision":
        return Boolean(scenarioPick);
      case "visual_hotspot":
        return Boolean(hotspotPick);
      case "drag_order":
        return dragIds.length > 0;
      case "debate_pick":
        return Boolean(debatePick);
      case "sandbox_simulation":
        return sandboxSelected.length > 0;
      default:
        return false;
    }
  })();

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[18px] border border-arc-purple-100 bg-white p-4 shadow-[0_3px_0_rgba(107,78,255,0.06)]"
    >
      <div className="mb-3 flex items-center gap-2 text-arc-purple-600">
        {icon}
        <span className="text-[11px] font-black tracking-[0.1em] uppercase">
          {block.type.replace(/_/g, " ")}
        </span>
      </div>

      {block.type === "scenario_decision" ? (
        <>
          <p className="text-[15px] font-semibold text-[#2b1b57]">
            <InlineMarkdown text={block.setup} />
          </p>
          <div className="mt-3 space-y-2">
            {block.options.map((opt) => (
              <LessonOptionCard
                key={opt.id}
                label={opt.label}
                selected={scenarioPick === opt.id}
                revealed={revealed}
                correct={
                  revealed ? reveal?.correct && scenarioPick === opt.id : false
                }
                onSelect={() => {
                  if (revealed) return;
                  onScenarioPick(blockId, opt.id);
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      {block.type === "visual_hotspot" ? (
        <>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-[#e8e2f8]">
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[12px] font-bold text-[#4a3d78]/70">
              {block.imageAssetKey}
            </div>
            {block.hotspots.map((hs) => {
              const left = hs.x != null ? `${hs.x * 100}%` : undefined;
              const top = hs.y != null ? `${hs.y * 100}%` : undefined;
              return (
                <button
                  key={hs.id}
                  type="button"
                  disabled={revealed}
                  onClick={() => onHotspotPick(blockId, hs.id)}
                  style={
                    left != null && top != null
                      ? { left, top, transform: "translate(-50%, -50%)" }
                      : undefined
                  }
                  className={cn(
                    "absolute min-h-9 min-w-9 rounded-full border-2 px-2 text-[11px] font-bold",
                    hotspotPick === hs.id
                      ? "border-arc-purple-500 bg-arc-purple-500 text-white"
                      : "border-white/80 bg-white/90 text-[#2b1b57]",
                    left == null && "mx-1 mt-2 inline-flex",
                    revealed &&
                      reveal?.correct &&
                      hotspotPick === hs.id &&
                      "ring-2 ring-[#16a56b]",
                  )}
                >
                  {hs.label ?? "Tap"}
                </button>
              );
            })}
          </div>
          {!block.hotspots.some((h) => h.x != null) ? (
            <div className="mt-3 space-y-2">
              {block.hotspots.map((hs) => (
                <LessonOptionCard
                  key={hs.id}
                  label={hs.label ?? hs.id}
                  selected={hotspotPick === hs.id}
                  revealed={revealed}
                  correct={
                    revealed ? reveal?.correct && hotspotPick === hs.id : false
                  }
                  onSelect={() => {
                    if (revealed) return;
                    onHotspotPick(blockId, hs.id);
                  }}
                />
              ))}
            </div>
          ) : null}
        </>
      ) : null}

      {block.type === "drag_order" ? (
        <DragOrderList
          block={block}
          order={dragIds}
          revealed={revealed}
          correct={revealed ? reveal?.correct : undefined}
          onReorder={(ids) => onDragReorder(blockId, ids)}
        />
      ) : null}

      {block.type === "debate_pick" ? (
        <>
          <p className="text-[15px] font-semibold text-[#2b1b57]">
            <InlineMarkdown text={block.prompt} />
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <LessonOptionCard
              label={block.sideA}
              selected={debatePick === "a"}
              revealed={revealed}
              correct={revealed ? reveal?.correct && debatePick === "a" : false}
              onSelect={() => {
                if (revealed) return;
                onDebatePick(blockId, "a");
              }}
            />
            <LessonOptionCard
              label={block.sideB}
              selected={debatePick === "b"}
              revealed={revealed}
              correct={revealed ? reveal?.correct && debatePick === "b" : false}
              onSelect={() => {
                if (revealed) return;
                onDebatePick(blockId, "b");
              }}
            />
          </div>
        </>
      ) : null}

      {block.type === "sandbox_simulation" ? (
        <>
          <p className="text-[13px] font-semibold text-[#4a3d78]">
            Simulation: {block.simulationAssetKey}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {block.actions.map((action) => {
              const on = sandboxSelected.includes(action);
              return (
                <button
                  key={action}
                  type="button"
                  disabled={revealed}
                  onClick={() => onSandboxToggle(blockId, action)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-bold transition-colors",
                    on
                      ? "bg-arc-purple-500 text-white"
                      : "bg-[#f3effc] text-[#4a3d78] ring-1 ring-arc-purple-100",
                  )}
                >
                  {formatActionLabel(action)}
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {revealed && (reveal?.outcome || reveal?.explanation) ? (
        <p
          className={cn(
            "mt-3 text-[14px] font-semibold",
            reveal.correct ? "text-[#16a56b]" : "text-[#9a4a12]",
          )}
        >
          <InlineMarkdown
            text={reveal.outcome ?? reveal.explanation ?? ""}
          />
        </p>
      ) : null}

      {isGradeable(block) && !revealed ? (
        <div className="mt-4">
          <LessonPrimaryButton
            disabled={!canCheck || checking}
            onClick={() => onCheck(block, blockId)}
            className="py-3 text-[14px]"
          >
            {checking ? "Checking…" : "Check"}
          </LessonPrimaryButton>
        </div>
      ) : null}
    </motion.section>
  );
});

function DragOrderList({
  block,
  order,
  revealed,
  correct,
  onReorder,
}: {
  block: Extract<LessonActiveBlockDto, { type: "drag_order" }>;
  order: string[];
  revealed: boolean;
  correct?: boolean;
  onReorder: (ids: string[]) => void;
}) {
  const labelById = useMemo(
    () => new Map(block.items.map((i) => [i.id, i.label])),
    [block.items],
  );

  const move = (index: number, dir: -1 | 1) => {
    if (revealed) return;
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    onReorder(next);
  };

  return (
    <ul className="space-y-2">
      {order.map((id, index) => (
        <li
          key={id}
          className={cn(
            "flex items-center gap-2 rounded-[14px] bg-[#f3effc] px-3 py-2.5",
            revealed && correct && "ring-1 ring-[#16a56b]/40",
          )}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-arc-purple-600">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#2b1b57]">
            {labelById.get(id) ?? id}
          </span>
          {!revealed ? (
            <div className="flex shrink-0 gap-0.5">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#4a3d78] disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#4a3d78] disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

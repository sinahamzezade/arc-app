import type { LessonPlayDto } from "@/lib/api/types";
import type { LessonContentBlock, LessonContentPage } from "@/lib/lesson/types";

/** UI playable lesson — no grading keys (server owns those). */
export type PlayableLesson = {
  id: string;
  lessonNumber: number;
  title: string;
  missionName: string;
  minutes: number;
  xpReward: number;
  objective: string;
  contentSource: {
    lessonTemplateId: string | null;
    lessonVersionId: string | null;
    version: number | null;
    status: string | null;
    rewardClass: string | null;
  } | null;
  resource: { label: string; href: string; note: string };
  arloPrompt: string;
  content: LessonContentPage[];
  practice: {
    id: string;
    prompt: string;
    hint: string;
    options: { id: string; label: string }[];
  };
  quiz: {
    id: string;
    prompt: string;
    options: { id: string; label: string }[];
  }[];
  reward: {
    xp: number;
    gems: number;
    coins: number;
    badgeId?: string;
    badgeLabel?: string;
    arloLine: string;
  };
  suggestedArlo: string[];
};

export function mapPlayDtoToLesson(dto: LessonPlayDto): PlayableLesson {
  return {
    id: dto.id,
    lessonNumber: dto.lessonNumber,
    title: dto.title,
    missionName: dto.missionName?.trim() || "Trail stop",
    minutes: dto.minutes,
    xpReward: dto.xpReward,
    objective: dto.objective,
    contentSource: dto.contentSource
      ? {
          lessonTemplateId: dto.contentSource.lessonTemplateId,
          lessonVersionId: dto.contentSource.lessonVersionId,
          version: dto.contentSource.version,
          status: dto.contentSource.status,
          rewardClass: dto.contentSource.rewardClass,
        }
      : null,
    resource: {
      label: dto.resource.label,
      href: dto.resource.href,
      note: dto.resource.note,
    },
    arloPrompt: dto.arloPrompt,
    content: dto.content.map((page) => ({
      id: page.id,
      title: page.title,
      blocks: page.blocks as LessonContentBlock[],
    })),
    practice: {
      id: dto.practice.id,
      prompt: dto.practice.prompt,
      hint: dto.practice.hint,
      options: dto.practice.options.map((o) => ({
        id: o.id,
        label: o.label,
      })),
    },
    quiz: dto.quiz.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, label: o.label })),
    })),
    reward: {
      xp: dto.rewardPreview.xp,
      gems: dto.rewardPreview.gems,
      coins: dto.rewardPreview.coins,
      badgeId: dto.rewardPreview.badgeId,
      badgeLabel: dto.rewardPreview.badgeLabel,
      arloLine: dto.rewardPreview.arloLine,
    },
    suggestedArlo: dto.suggestedArlo ?? [],
  };
}

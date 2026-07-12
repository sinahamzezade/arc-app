import type { BattlePlayQuestionDto } from "@/lib/api/content";
import type { BattleQuestion } from "@/lib/battle/mock-data";

/**
 * Map pool battle question → UI card.
 * Strips any accidental answer keys — play never shows grading data.
 */
export function mapPoolQuestionToBattle(
  dto: BattlePlayQuestionDto,
): BattleQuestion {
  const stem =
    typeof dto.prompt?.stem === "string"
      ? dto.prompt.stem
      : typeof dto.prompt?.body === "string"
        ? dto.prompt.body
        : "Question";

  return {
    id: dto.questionVersionId,
    questionVersionId: dto.questionVersionId,
    prompt: stem,
    options: dto.options.map((o) => ({ id: o.id, label: o.label })),
  };
}

export function mapPoolQuestionsToBattle(
  dtos: BattlePlayQuestionDto[],
): BattleQuestion[] {
  return dtos.map(mapPoolQuestionToBattle);
}

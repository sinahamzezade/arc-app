import { z } from "zod";

export const lessonQuizAnswerSchema = z.record(z.string(), z.string());

export const lessonProgressSchema = z.object({
  lessonId: z.string(),
  contentStep: z.number().int().min(0),
  practiceDone: z.boolean(),
  quizAnswers: lessonQuizAnswerSchema,
  completed: z.boolean(),
});

export type LessonProgress = z.infer<typeof lessonProgressSchema>;

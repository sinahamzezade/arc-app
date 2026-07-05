import { z } from "zod";

export const questionnaireAnswersSchema = z.object({
  goal: z.array(z.string()).min(1, "Select at least one"),
  motivation: z.array(z.string()).min(1, "Select at least one"),
  motivationOther: z.string().optional(),
  currentJob: z.string().min(1, "Select one option"),
  currentJobOther: z.string().optional(),
  skills: z.array(z.string()).min(1, "Select at least one"),
  skillsOther: z.string().optional(),
  studyHours: z.string().min(1, "Select one option"),
  schedule: z.object({
    days: z.array(z.string()).min(1, "Select at least one day"),
    times: z.array(z.string()).min(1, "Select at least one time"),
  }),
  deadline: z.string().min(1, "Select one option"),
  learningStyle: z.array(z.string()).min(1, "Select at least one"),
  learningStyleOther: z.string().optional(),
  confidence: z.string().min(1, "Select one option"),
  quitReasons: z.array(z.string()).min(1, "Select at least one"),
  quitReasonsOther: z.string().optional(),
});

export type QuestionnaireAnswers = z.infer<typeof questionnaireAnswersSchema>;

export const emptyQuestionnaireAnswers: QuestionnaireAnswers = {
  goal: [],
  motivation: [],
  currentJob: "",
  skills: [],
  studyHours: "",
  schedule: { days: [], times: [] },
  deadline: "",
  learningStyle: [],
  confidence: "",
  quitReasons: [],
};

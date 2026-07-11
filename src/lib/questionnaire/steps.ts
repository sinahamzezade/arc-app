import {
  BarChart3,
  Briefcase,
  Calendar,
  Clock,
  Code,
  Flame,
  GraduationCap,
  Megaphone,
  Mountain,
  Rocket,
  Server,
  Shield,
  Smile,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const QUESTIONNAIRE_TOTAL_STEPS = 10;

export type StepFieldKey = keyof typeof stepFieldKeys;

export const stepFieldKeys = {
  goal: "goal",
  motivation: "motivation",
  currentJob: "currentJob",
  skills: "skills",
  studyHours: "studyHours",
  schedule: "schedule",
  deadline: "deadline",
  learningStyle: "learningStyle",
  confidence: "confidence",
  quitReasons: "quitReasons",
} as const;

export type StepOption = {
  value: string;
  label: string;
  icon?: LucideIcon;
  iconClassName?: string;
};

export type QuestionnaireStepConfig = {
  id: StepFieldKey;
  stepNumber: number;
  title: string;
  subtitle: string;
  selection: "single" | "multi";
  allowOther?: boolean;
  options: StepOption[];
};

export const questionnaireSteps: QuestionnaireStepConfig[] = [
  {
    id: "goal",
    stepNumber: 1,
    title: "What do you want to become?",
    subtitle: "You can choose one or more. We'll build your roadmap from here.",
    selection: "multi",
    options: [
      {
        value: "data-analyst",
        label: "Data Analyst",
        icon: BarChart3,
        iconClassName: "bg-arc-purple-100 text-arc-purple-600",
      },
      {
        value: "front-end-developer",
        label: "Front End Developer",
        icon: Code,
        iconClassName: "bg-arc-green-100 text-arc-green-600",
      },
      {
        value: "back-end-developer",
        label: "Back End Developer",
        icon: Server,
        iconClassName: "bg-arc-purple-100 text-arc-purple-600",
      },
      {
        value: "marketing-specialist",
        label: "Marketing Specialist",
        icon: Megaphone,
        iconClassName: "bg-arc-purple-100 text-arc-purple-600",
      },
    ],
  },
  {
    id: "motivation",
    stepNumber: 2,
    title: "Why is this important to you?",
    subtitle: "Select all that apply.",
    selection: "multi",
    allowOther: true,
    options: [
      { value: "career", label: "Better career opportunities" },
      { value: "income", label: "Higher income" },
      { value: "growth", label: "Personal growth" },
      { value: "satisfaction", label: "Job satisfaction" },
      { value: "meaningful", label: "Work on meaningful projects" },
    ],
  },
  {
    id: "currentJob",
    stepNumber: 3,
    title: "What is your current job?",
    subtitle: "Select the option that best describes you.",
    selection: "single",
    allowOther: true,
    options: [
      { value: "student", label: "Student" },
      { value: "employed-related", label: "Employed – related field" },
      { value: "employed-unrelated", label: "Employed – unrelated field" },
      { value: "freelancer", label: "Freelancer" },
      { value: "not-working", label: "Not working" },
    ],
  },
  {
    id: "skills",
    stepNumber: 4,
    title: "What skills do you already have?",
    subtitle: "Select all that apply.",
    selection: "multi",
    allowOther: true,
    options: [
      { value: "excel", label: "Excel / Google Sheets" },
      { value: "sql", label: "SQL" },
      { value: "python", label: "Python" },
      { value: "javascript", label: "JavaScript" },
      { value: "html-css", label: "HTML / CSS" },
      { value: "data-viz", label: "Data Visualization" },
      { value: "communication", label: "Communication" },
      { value: "marketing-seo", label: "Marketing / SEO" },
      { value: "none", label: "None of the above" },
    ],
  },
  {
    id: "studyHours",
    stepNumber: 5,
    title: "How many hours per week can you dedicate to learning?",
    subtitle: "Select one option.",
    selection: "single",
    options: [
      { value: "lt-3", label: "Less than 3 hours" },
      { value: "3-5", label: "3–5 hours" },
      { value: "5-8", label: "5–8 hours" },
      { value: "8-12", label: "8–12 hours" },
      { value: "gt-12", label: "More than 12 hours" },
    ],
  },
  {
    id: "schedule",
    stepNumber: 6,
    title: "What days or times work best for you?",
    subtitle: "Select all that apply.",
    selection: "multi",
    options: [],
  },
  {
    id: "deadline",
    stepNumber: 7,
    title: "What is your target deadline?",
    subtitle: "Select one option.",
    selection: "single",
    options: [
      { value: "1-3", label: "1–3 months" },
      { value: "3-6", label: "3–6 months" },
      { value: "6-12", label: "6–12 months" },
      { value: "12+", label: "12+ months" },
      { value: "none", label: "No specific deadline" },
    ],
  },
  {
    id: "learningStyle",
    stepNumber: 8,
    title: "What learning style do you prefer?",
    subtitle: "Select all that apply.",
    selection: "multi",
    allowOther: true,
    options: [
      { value: "doing", label: "Learn by doing (Projects)" },
      { value: "videos", label: "Watch & learn (Videos)" },
      { value: "reading", label: "Read & understand" },
      { value: "quizzes", label: "Interactive quizzes" },
      { value: "guides", label: "Follow step-by-step guides" },
    ],
  },
  {
    id: "confidence",
    stepNumber: 9,
    title: "What is your confidence level right now?",
    subtitle: "Select one option.",
    selection: "single",
    options: [
      { value: "starting", label: "Just getting started", icon: Sparkles },
      { value: "beginner", label: "Beginner", icon: Smile },
      { value: "somewhat", label: "Somewhat confident", icon: Zap },
      { value: "confident", label: "Confident", icon: Flame },
      { value: "very", label: "Very confident", icon: Rocket },
    ],
  },
  {
    id: "quitReasons",
    stepNumber: 10,
    title: "What has made you quit learning before?",
    subtitle: "Select all that apply.",
    selection: "multi",
    allowOther: true,
    options: [
      { value: "time", label: "Lack of time" },
      { value: "motivation", label: "Lost motivation" },
      { value: "information", label: "Too much information" },
      { value: "direction", label: "No clear direction" },
      { value: "overwhelming", label: "Too hard / Overwhelming" },
    ],
  },
];

export const scheduleDays = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export const scheduleTimes = [
  { value: "morning", label: "Morning (6 AM – 12 PM)" },
  { value: "afternoon", label: "Afternoon (12 PM – 5 PM)" },
  { value: "evening", label: "Evening (5 PM – 10 PM)" },
  { value: "late-night", label: "Late Night (10 PM – 2 AM)" },
] as const;

export type ReviewItem = {
  key: StepFieldKey;
  label: string;
  icon: LucideIcon;
};

export const reviewItems: ReviewItem[] = [
  { key: "goal", label: "Goal", icon: Target },
  { key: "motivation", label: "Why", icon: Mountain },
  { key: "currentJob", label: "Current Job", icon: Briefcase },
  { key: "skills", label: "Skills", icon: BarChart3 },
  { key: "studyHours", label: "Study Time", icon: Clock },
  { key: "schedule", label: "Best Time", icon: Calendar },
  { key: "deadline", label: "Deadline", icon: Clock },
  { key: "learningStyle", label: "Learning Style", icon: GraduationCap },
  { key: "confidence", label: "Confidence Level", icon: BarChart3 },
  { key: "quitReasons", label: "Challenges", icon: Shield },
];

export function getStepByNumber(stepNumber: number) {
  return questionnaireSteps.find((step) => step.stepNumber === stepNumber);
}

export function getOptionLabel(stepId: StepFieldKey, value: string) {
  if (stepId === "schedule") {
    const day = scheduleDays.find((d) => d.toLowerCase() === value);
    if (day) return day;
    return scheduleTimes.find((t) => t.value === value)?.label ?? value;
  }

  const step = questionnaireSteps.find((s) => s.id === stepId);
  return step?.options.find((o) => o.value === value)?.label ?? value;
}

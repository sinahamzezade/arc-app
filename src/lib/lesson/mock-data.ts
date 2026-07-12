export type LessonContentBlock =
  | { type: "text"; body: string }
  | { type: "callout"; title: string; body: string }
  | { type: "code"; label: string; code: string };

export type LessonContentPage = {
  id: string;
  title: string;
  blocks: LessonContentBlock[];
};

export type LessonPractice = {
  prompt: string;
  hint: string;
  options: { id: string; label: string; correct: boolean }[];
};

export type LessonQuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
};

export type LessonReward = {
  xp: number;
  gems: number;
  coins: number;
  badgeId?: "first-step";
  badgeLabel?: string;
  arloLine: string;
};

export type LessonMock = {
  id: string;
  lessonNumber: number;
  title: string;
  missionName: string;
  minutes: number;
  xpReward: number;
  objective: string;
  resource: { label: string; href: string; note: string };
  arloPrompt: string;
  content: LessonContentPage[];
  practice: LessonPractice;
  quiz: LessonQuizQuestion[];
  reward: LessonReward;
  suggestedArlo: string[];
};

export const lessonCatalog: Record<string, LessonMock> = {
  "lesson-1": {
    id: "lesson-1",
    lessonNumber: 1,
    title: "Your first webpage",
    missionName: "Hello World Rookie",
    minutes: 18,
    xpReward: 35,
    objective:
      "Build a tiny HTML page with a title, heading, and paragraph — then explain what each tag does.",
    resource: {
      label: "MDN: Getting started with HTML",
      href: "https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/Getting_started",
      note: "Skim the first section. Skip anything past basic tags for now.",
    },
    arloPrompt: "Stuck on tags? Ask me — I live for dramatic HTML moments.",
    content: [
      {
        id: "c1",
        title: "HTML is the skeleton",
        blocks: [
          {
            type: "text",
            body: "A webpage is just a structured document. HTML tags tell the browser what each piece means — heading, paragraph, link, image.",
          },
          {
            type: "callout",
            title: "Arlo says",
            body: "Think LEGO instructions, not poetry. Clear tags beat fancy fluff.",
          },
        ],
      },
      {
        id: "c2",
        title: "The holy trinity",
        blocks: [
          {
            type: "text",
            body: "Almost every page starts with three containers: html, head, and body. Head holds metadata. Body holds what humans see.",
          },
          {
            type: "code",
            label: "starter.html",
            code: `<!DOCTYPE html>
<html>
  <head>
    <title>My first page</title>
  </head>
  <body>
    <h1>Hello, Arc</h1>
    <p>I am learning HTML.</p>
  </body>
</html>`,
          },
        ],
      },
      {
        id: "c3",
        title: "Tags you will use today",
        blocks: [
          {
            type: "text",
            body: "h1 = main heading. p = paragraph. title = tab name in the browser. Closing tags end with a slash: </p>.",
          },
          {
            type: "callout",
            title: "Mission tip",
            body: "One h1 per page for now. Save nested drama for later lessons.",
          },
        ],
      },
    ],
    practice: {
      prompt:
        "Which snippet correctly opens a paragraph and closes it?",
      hint: "Opening tag, text, closing tag with a slash.",
      options: [
        { id: "a", label: "<p>Hello Arc</p>", correct: true },
        { id: "b", label: "<p>Hello Arc<p>", correct: false },
        { id: "c", label: "</p>Hello Arc<p>", correct: false },
        { id: "d", label: "p: Hello Arc", correct: false },
      ],
    },
    quiz: [
      {
        id: "q1",
        prompt: "Where does visible page content live?",
        options: [
          { id: "a", label: "<head>" },
          { id: "b", label: "<body>" },
          { id: "c", label: "<title>" },
          { id: "d", label: "<meta>" },
        ],
        correctOptionId: "b",
        explanation: "Body is the stage. Head is backstage metadata.",
      },
      {
        id: "q2",
        prompt: "What does <h1> represent?",
        options: [
          { id: "a", label: "A hyperlink" },
          { id: "b", label: "The main heading" },
          { id: "c", label: "A horizontal rule" },
          { id: "d", label: "A comment" },
        ],
        correctOptionId: "b",
        explanation: "h1 is the top-level heading — your page’s headline.",
      },
      {
        id: "q3",
        prompt: "Which title tag is valid?",
        options: [
          { id: "a", label: "<title>My page<title>" },
          { id: "b", label: "<title>My page</title>" },
          { id: "c", label: "title=My page" },
          { id: "d", label: "<h1 title>My page</h1>" },
        ],
        correctOptionId: "b",
        explanation: "Open, text, close with a slash. Same pattern as paragraphs.",
      },
    ],
    reward: {
      xp: 35,
      gems: 2,
      coins: 15,
      badgeId: "first-step",
      badgeLabel: "First Step",
      arloLine: "Plot twist: you shipped a real webpage skeleton. Rookie no more.",
    },
    suggestedArlo: [
      "Explain <head> vs <body> like I'm five",
      "Why do I need </p>?",
      "Quiz me on h1 vs p",
    ],
  },
};

/** Catalog lookup only. Roadmap UUID lessons → use resolvePlayableLesson. */
export function getLesson(lessonId: string): LessonMock | null {
  if (!lessonId) return null;
  return lessonCatalog[lessonId] ?? null;
}

export function getDefaultLessonId() {
  return "lesson-1";
}

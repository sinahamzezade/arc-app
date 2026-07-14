export type LessonContentBlock =
  | { type: "text"; body: string }
  | { type: "callout"; title: string; body: string }
  | { type: "code"; label: string; code: string };

export type LessonContentPage = {
  id: string;
  title: string;
  blocks: LessonContentBlock[];
};

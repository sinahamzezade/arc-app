export type PathNodeKind = "lesson" | "milestone" | "unit-gate";

export type PathNodeStatus =
  | "current"
  | "done"
  | "locked"
  | "milestone"
  | "unit-locked";

export type PathIconName =
  | "flag"
  | "tag"
  | "trend-up"
  | "trophy"
  | "link"
  | "mask"
  | "lock"
  | "palette"
  | "columns";

export type PathNode = {
  id: string;
  title: string;
  subtitle: string;
  kind: PathNodeKind;
  status: PathNodeStatus;
  icon: PathIconName;
  unit: number;
  /** Lock badge on locked lesson nodes. Default true. */
  showLock?: boolean;
};

export type PathMockData = {
  trackTitle: string;
  milestoneCount: number;
  lessonsDone: number;
  lessonsTotal: number;
  rank: {
    level: number;
    title: string;
    unitLabel: string;
  };
  nodes: PathNode[];
  upNext: {
    lessonNumber: number;
    title: string;
    href: string;
    minutes: number;
  };
};

export const pathMockData: PathMockData = {
  trackTitle: "Frontend Developer",
  milestoneCount: 6,
  lessonsDone: 0,
  lessonsTotal: 42,
  rank: {
    level: 1,
    title: "Hello World Rookie",
    unitLabel: "Unit 1",
  },
  nodes: [
    {
      id: "n1",
      title: "Hello World Rookie",
      subtitle: "Lesson 1",
      kind: "lesson",
      status: "current",
      icon: "flag",
      unit: 1,
    },
    {
      id: "n2",
      title: "Tag Wrangler",
      subtitle: "Lesson 2",
      kind: "lesson",
      status: "locked",
      icon: "tag",
      unit: 1,
    },
    {
      id: "n3",
      title: "Rising Coder",
      subtitle: "Lesson 3",
      kind: "lesson",
      status: "locked",
      icon: "trend-up",
      unit: 1,
    },
    {
      id: "n4",
      title: "First Webpage",
      subtitle: "Milestone",
      kind: "milestone",
      status: "milestone",
      icon: "trophy",
      unit: 1,
    },
    {
      id: "n5",
      title: "Link Ranger",
      subtitle: "Lesson 4",
      kind: "lesson",
      status: "locked",
      icon: "link",
      unit: 1,
    },
    {
      id: "n6",
      title: "Ninja Coder",
      subtitle: "Lesson 5",
      kind: "lesson",
      status: "locked",
      icon: "mask",
      unit: 1,
    },
    {
      id: "n7",
      title: "CSS & Layout",
      subtitle: "Unit 2",
      kind: "unit-gate",
      status: "unit-locked",
      icon: "lock",
      unit: 2,
    },
    {
      id: "n8",
      title: "Style Samurai",
      subtitle: "Lesson 6",
      kind: "lesson",
      status: "locked",
      icon: "palette",
      unit: 2,
      showLock: false,
    },
    {
      id: "n9",
      title: "Flexbox Fighter",
      subtitle: "Lesson 7",
      kind: "lesson",
      status: "locked",
      icon: "columns",
      unit: 2,
      showLock: false,
    },
  ],
  upNext: {
    lessonNumber: 1,
    title: "Your first webpage",
    href: "/learn/lesson-1",
    minutes: 18,
  },
};

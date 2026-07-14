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

export type PathData = {
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

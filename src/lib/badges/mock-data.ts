import { assets } from "@/lib/assets";

export type BadgeStatus = "earned" | "locked";

export type BadgeCategory = "streak" | "skill" | "social" | "milestone";

export type BadgeItem = {
  id: string;
  name: string;
  blurb: string;
  category: BadgeCategory;
  status: BadgeStatus;
  earnedOn?: string;
  image: string;
};

export type BadgesMockData = {
  earned: number;
  total: number;
  featuredIds: string[];
  items: BadgeItem[];
};

export const badgesMockData: BadgesMockData = {
  earned: 12,
  total: 24,
  featuredIds: ["first-step", "sql-spark", "weekly-warrior"],
  items: [
    {
      id: "first-step",
      name: "First Step",
      blurb: "Complete your first lesson",
      category: "milestone",
      status: "earned",
      earnedOn: "Day 1",
      image: assets.badges.firstStep,
    },
    {
      id: "sql-spark",
      name: "SQL Spark",
      blurb: "Finish SQL Basics track start",
      category: "skill",
      status: "earned",
      earnedOn: "Week 1",
      image: assets.badges.sqlSpark,
    },
    {
      id: "weekly-warrior",
      name: "Weekly Warrior",
      blurb: "Hit weekly commitment once",
      category: "streak",
      status: "earned",
      earnedOn: "Week 2",
      image: assets.badges.weeklyWarrior,
    },
    {
      id: "quiz-crusher",
      name: "Quiz Crusher",
      blurb: "Pass 5 quizzes at 80%+",
      category: "skill",
      status: "earned",
      earnedOn: "Week 3",
      image: assets.badges.quizCrusher,
    },
    {
      id: "early-bird",
      name: "Early Bird",
      blurb: "Learn before 9am three times",
      category: "streak",
      status: "earned",
      earnedOn: "Week 3",
      image: assets.badges.earlyBird,
    },
    {
      id: "night-owl",
      name: "Night Owl",
      blurb: "Finish a lesson after 10pm",
      category: "streak",
      status: "earned",
      earnedOn: "Week 4",
      image: assets.badges.nightOwl,
    },
    {
      id: "comeback-eagle",
      name: "Comeback Eagle",
      blurb: "Return after a missed week",
      category: "streak",
      status: "earned",
      earnedOn: "Week 5",
      image: assets.badges.comebackEagle,
    },
    {
      id: "project-starter",
      name: "Project Starter",
      blurb: "Begin your first portfolio piece",
      category: "milestone",
      status: "earned",
      earnedOn: "Week 6",
      image: assets.badges.projectStarter,
    },
    {
      id: "four-week-flame",
      name: "Four-Week Flame",
      blurb: "4 weekly commitment streaks",
      category: "streak",
      status: "earned",
      earnedOn: "Week 7",
      image: assets.badges.fourWeekFlame,
    },
    {
      id: "job-ready",
      name: "Job-Ready Eagle",
      blurb: "Pass readiness assessment",
      category: "milestone",
      status: "locked",
      image: assets.badges.jobReadyEagle,
    },
    {
      id: "battle-rookie",
      name: "Battle Rookie",
      blurb: "Win your first friend Battle",
      category: "social",
      status: "locked",
      image: assets.badges.sqlSpark,
    },
    {
      id: "invite-spark",
      name: "Invite Spark",
      blurb: "A friend activates with your code",
      category: "social",
      status: "locked",
      image: assets.badges.firstStep,
    },
  ],
};

export const badgeFilters = [
  { id: "all" as const, label: "All" },
  { id: "earned" as const, label: "Earned" },
  { id: "locked" as const, label: "Locked" },
];

export type ProfileSkillStatus = "verified" | "locked" | "in_progress";

export type ProfileSkill = {
  id: string;
  name: string;
  status: ProfileSkillStatus;
};

export type ProfileMockData = {
  userName: string;
  becoming: string;
  fromRole: string;
  level: number;
  day: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  weekStreak: number;
  badgesEarned: number;
  badgesTotal: number;
  coins: number;
  gems: number;
  plan: {
    name: string;
    price: string;
    teaser: string;
  };
  skills: ProfileSkill[];
};

export const profileMockData: ProfileMockData = {
  userName: "Soheil",
  becoming: "Data Analyst",
  fromRole: "Office worker",
  level: 5,
  day: 38,
  xp: 1250,
  xpIntoLevel: 250,
  xpForNextLevel: 500,
  weekStreak: 7,
  badgesEarned: 12,
  badgesTotal: 24,
  coins: 2450,
  gems: 350,
  plan: {
    name: "Core plan",
    price: "$29/mo",
    teaser: "Add commitment stakes & a human coach",
  },
  skills: [
    { id: "sql-basics", name: "SQL Basics", status: "verified" },
    { id: "filtering", name: "Filtering", status: "verified" },
    { id: "joins", name: "JOINs", status: "in_progress" },
    { id: "aggregates", name: "Aggregates", status: "locked" },
    { id: "viz", name: "Data Viz", status: "locked" },
  ],
};

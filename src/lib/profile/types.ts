export type ProfileSkillStatus = "verified" | "locked" | "in_progress";

export type ProfileSkill = {
  id: string;
  name: string;
  status: ProfileSkillStatus;
};

export type ProfileData = {
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
  followers: number;
  following: number;
  coins: number;
  gems: number;
  plan: {
    name: string;
    price: string;
    teaser: string;
  };
  skills: ProfileSkill[];
};

/** Empty profile shell — fill from session / APIs. */
export function emptyProfileData(
  overrides: Partial<ProfileData> = {},
): ProfileData {
  return {
    userName: "",
    becoming: "",
    fromRole: "",
    level: 1,
    day: 1,
    xp: 0,
    xpIntoLevel: 0,
    xpForNextLevel: 1,
    weekStreak: 0,
    badgesEarned: 0,
    badgesTotal: 0,
    followers: 0,
    following: 0,
    coins: 0,
    gems: 0,
    plan: {
      name: "",
      price: "",
      teaser: "",
    },
    skills: [],
    ...overrides,
  };
}

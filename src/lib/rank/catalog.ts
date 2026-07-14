/** Static rank education copy — not user fixtures. */
export const rankHowToEarn = [
  { label: "Finish a lesson", xp: "+20–40 XP" },
  { label: "Pass a quiz", xp: "+25 XP" },
  { label: "Hit weekly commitment", xp: "+50 XP" },
  { label: "Milestone clear", xp: "+80 XP" },
] as const;

export const rankWalletTips = [
  {
    currency: "XP" as const,
    tip: "Levels the rank ladder. Lessons, quizzes, weekly goals.",
  },
  {
    currency: "Gems" as const,
    tip: "Premium flex — chests, cosmetics, streak freeze later.",
  },
  {
    currency: "Coins" as const,
    tip: "Everyday spend — spins, small boosts, shop fluff.",
  },
];

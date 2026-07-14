export type RankTier = {
  id: string;
  name: string;
  levelRequired: number;
  blurb: string;
  status: "locked" | "current" | "earned";
};

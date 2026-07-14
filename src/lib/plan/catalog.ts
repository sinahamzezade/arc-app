export type PlanPerk = {
  id: string;
  title: string;
  detail: string;
  included: boolean;
};

export type PlanCatalog = {
  name: string;
  price: string;
  billingNote: string;
  status: "active";
  renewsOn: string;
  teaser: string;
  perks: PlanPerk[];
  upgrades: {
    id: string;
    title: string;
    price: string;
    blurb: string;
  }[];
};

/** Static pricing tiers until a billing API ships. */
export const planCatalog: PlanCatalog = {
  name: "Core plan",
  price: "$29/mo",
  billingNote: "Billed monthly · cancel anytime",
  status: "active",
  renewsOn: "",
  teaser: "Add commitment stakes & a human coach",
  perks: [
    {
      id: "p1",
      title: "AI coach Arlo",
      detail: "Roadmaps, weekly plans, lesson help",
      included: true,
    },
    {
      id: "p2",
      title: "Full Path + Battle",
      detail: "Lessons, practice, friend battles",
      included: true,
    },
    {
      id: "p3",
      title: "League + Wallet",
      detail: "Weekly XP race, gems & coins",
      included: true,
    },
    {
      id: "p4",
      title: "Commitment stakes",
      detail: "Put coins on your weekly goal",
      included: false,
    },
    {
      id: "p5",
      title: "Human coach sessions",
      detail: "Live check-ins with a career coach",
      included: false,
    },
  ],
  upgrades: [
    {
      id: "plus",
      title: "Core Plus",
      price: "$49/mo",
      blurb: "Stakes + priority Arlo + chest boosts",
    },
    {
      id: "coach",
      title: "Coach Lane",
      price: "$99/mo",
      blurb: "Everything Plus + 2 human sessions / mo",
    },
  ],
};

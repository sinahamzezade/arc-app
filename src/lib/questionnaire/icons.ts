import { icons, type LucideIcon } from "lucide-react";

/** Legacy kebab keys from questionnaire seed → Lucide PascalCase export. */
const LEGACY_ICON_ALIASES: Record<string, keyof typeof icons> = {
  "bar-chart": "BarChart3",
  code: "Code",
  server: "Server",
  megaphone: "Megaphone",
  sparkles: "Sparkles",
  smile: "Smile",
  zap: "Zap",
  flame: "Flame",
  rocket: "Rocket",
  target: "Target",
  mountain: "Mountain",
  briefcase: "Briefcase",
  clock: "Clock",
  calendar: "Calendar",
  "graduation-cap": "GraduationCap",
  shield: "Shield",
};

function toPascalCase(key: string): string {
  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Backend sends Lucide PascalCase (or legacy kebab); resolve to component. */
export function resolveQuestionnaireIcon(
  key: string | undefined,
): LucideIcon | undefined {
  if (!key) return undefined;

  const direct = icons[key as keyof typeof icons];
  if (direct) return direct as LucideIcon;

  const legacy = LEGACY_ICON_ALIASES[key];
  if (legacy && icons[legacy]) return icons[legacy] as LucideIcon;

  const pascal = toPascalCase(key);
  const fromPascal = icons[pascal as keyof typeof icons];
  if (fromPascal) return fromPascal as LucideIcon;

  return undefined;
}

/** @deprecated Prefer resolveQuestionnaireIcon — kept for any old imports. */
export const questionnaireIconMap: Record<string, LucideIcon> = Object.fromEntries(
  Object.entries(LEGACY_ICON_ALIASES).map(([k, v]) => [k, icons[v]]),
) as Record<string, LucideIcon>;

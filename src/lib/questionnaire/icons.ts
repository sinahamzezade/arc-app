import {
  BarChart3,
  Briefcase,
  Calendar,
  Clock,
  Code,
  Flame,
  GraduationCap,
  Megaphone,
  Mountain,
  Rocket,
  Server,
  Shield,
  Smile,
  Sparkles,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Backend sends icon keys; frontend maps to Lucide. */
export const questionnaireIconMap: Record<string, LucideIcon> = {
  "bar-chart": BarChart3,
  code: Code,
  server: Server,
  megaphone: Megaphone,
  sparkles: Sparkles,
  smile: Smile,
  zap: Zap,
  flame: Flame,
  rocket: Rocket,
  target: Target,
  mountain: Mountain,
  briefcase: Briefcase,
  clock: Clock,
  calendar: Calendar,
  "graduation-cap": GraduationCap,
  shield: Shield,
};

export function resolveQuestionnaireIcon(
  key: string | undefined,
): LucideIcon | undefined {
  if (!key) return undefined;
  return questionnaireIconMap[key];
}

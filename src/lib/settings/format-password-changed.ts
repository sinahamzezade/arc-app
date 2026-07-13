/** Relative "Last changed …" label for password settings. */
export function formatPasswordChangedAgo(
  iso: string | null | undefined,
  now = new Date(),
): string {
  if (!iso) return "Never changed";

  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "Never changed";

  const diffMs = Math.max(0, now.getTime() - then.getTime());
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Last changed just now";
  if (minutes < 60) {
    return `Last changed ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Last changed ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `Last changed ${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Last changed ${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(months / 12);
  return `Last changed ${years} ${years === 1 ? "year" : "years"} ago`;
}

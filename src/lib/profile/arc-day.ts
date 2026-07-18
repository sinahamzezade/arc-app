/** Calendar days on Arlo since start ISO (Day 1 = start day). */
export function arcDayNumber(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return null;
  const utcStart = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );
  const now = new Date();
  const utcNow = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return Math.max(1, Math.floor((utcNow - utcStart) / 86_400_000) + 1);
}

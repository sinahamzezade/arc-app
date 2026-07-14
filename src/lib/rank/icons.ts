import { assets } from "@/lib/assets";

/**
 * Resolve rank art from API `iconAssetKey` / peer `avatarUrl`.
 * Upload paths (`/uploads/ranks/...`) stay same-origin (Next rewrites → Nest).
 * Seed keys / missing → Arlo fallback (profile hero).
 */
export function rankImageFor(iconAssetKey: string | null | undefined): string {
  if (!iconAssetKey) return assets.arlo.thumbsUp;
  if (
    iconAssetKey.startsWith("http://") ||
    iconAssetKey.startsWith("https://")
  ) {
    return iconAssetKey;
  }
  if (iconAssetKey.startsWith("/uploads/")) {
    return iconAssetKey;
  }
  return assets.arlo.thumbsUp;
}

/**
 * Displayable avatar src only — upload/remote.
 * Seed keys / empty → null so UI keep letter chip.
 */
export function rankAvatarSrc(
  iconAssetKey: string | null | undefined,
): string | null {
  if (!iconAssetKey) return null;
  if (
    iconAssetKey.startsWith("http://") ||
    iconAssetKey.startsWith("https://") ||
    iconAssetKey.startsWith("/uploads/")
  ) {
    return iconAssetKey;
  }
  return null;
}

/** True when src is admin upload / remote — skip next/image optimizer. */
export function isRankUploadSrc(src: string): boolean {
  return (
    src.startsWith("/uploads/") ||
    src.startsWith("http://") ||
    src.startsWith("https://")
  );
}

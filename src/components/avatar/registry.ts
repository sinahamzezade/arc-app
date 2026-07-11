export type AvatarGender = "boy" | "girl";

export type AvatarPartId = string;

/** Kept for callers that imported body / registry — cute avatar is monolithic. */
export const avatarPartRegistry = {} as Record<AvatarPartId, never>;

export const AVATAR_VIEWBOX = "0 0 260 310";
export const BaseBodyBoy = null;
export const BaseBodyGirl = null;
export const BaseBody = null;

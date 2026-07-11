import type { ComponentType } from "react";
import type { AvatarSvgProps } from "./parts/shared";
import { BaseBodyBoy, BaseBodyGirl } from "./parts/BaseBody";
import { CapeHero, CapeShadow } from "./parts/Capes";
import { GlassesRound, GlassesShade } from "./parts/Glasses";
import {
  HairBob,
  HairCurly,
  HairLong,
  HairPony,
  HairShort,
  HairSweep,
} from "./parts/Hair";
import { HatBeanie, HatCrown, HatGrad } from "./parts/Hats";
import {
  MoustacheHandlebar,
  MoustacheSoft,
  MoustacheThick,
} from "./parts/Moustache";
import { ShirtGoldZip, ShirtHoodie, ShirtTee } from "./parts/Shirts";
import { AVATAR_VIEWBOX } from "./parts/shared";

export type AvatarGender = "boy" | "girl";

export type AvatarPartId =
  | "hair-short"
  | "hair-sweep"
  | "hair-curly"
  | "hair-bob"
  | "hair-long"
  | "hair-pony"
  | "hat-beanie"
  | "hat-crown"
  | "hat-grad"
  | "glasses-round"
  | "glasses-shade"
  | "stache-soft"
  | "stache-handlebar"
  | "stache-thick"
  | "hoodie-arc"
  | "hoodie-gold"
  | "shirt-tee"
  | "cape-hero"
  | "cape-shadow";

export const avatarPartRegistry: Record<
  AvatarPartId,
  ComponentType<AvatarSvgProps>
> = {
  "hair-short": HairShort,
  "hair-sweep": HairSweep,
  "hair-curly": HairCurly,
  "hair-bob": HairBob,
  "hair-long": HairLong,
  "hair-pony": HairPony,
  "hat-beanie": HatBeanie,
  "hat-crown": HatCrown,
  "hat-grad": HatGrad,
  "glasses-round": GlassesRound,
  "glasses-shade": GlassesShade,
  "stache-soft": MoustacheSoft,
  "stache-handlebar": MoustacheHandlebar,
  "stache-thick": MoustacheThick,
  "hoodie-arc": ShirtHoodie,
  "hoodie-gold": ShirtGoldZip,
  "shirt-tee": ShirtTee,
  "cape-hero": CapeHero,
  "cape-shadow": CapeShadow,
};

export { BaseBodyBoy, BaseBodyGirl, AVATAR_VIEWBOX };
export const BaseBody = BaseBodyBoy;

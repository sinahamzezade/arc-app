"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  GLASSES_STYLES,
  HAIR_STYLES,
  MUSTACHE_STYLES,
  SHIRT_DECO,
  type CuteGlassesStyle,
  type CuteHairStyle,
  type CuteMustacheStyle,
  type CuteShirtStyle,
} from "./styles";

export type CuteAvatarLook = {
  gender?: "boy" | "girl";
  hair?: CuteHairStyle;
  mustache?: CuteMustacheStyle;
  glasses?: CuteGlassesStyle;
  shirt?: CuteShirtStyle;
  hairColor?: string;
  shirtColor?: string;
  /** Stage plate behind character — omit / transparent for no fill */
  background?: string;
};

type CuteAvatarProps = {
  look: CuteAvatarLook;
  className?: string;
  label?: string;
  size?: number;
  animate?: boolean;
};

export function CuteAvatar({
  look,
  className,
  label,
  size = 200,
  animate = true,
}: CuteAvatarProps) {
  const gender = look.gender ?? "boy";
  const isGirl = gender === "girl";
  const hair = look.hair ?? (isGirl ? "long" : "fluffy");
  const mustache = isGirl ? "none" : (look.mustache ?? "none");
  const glasses = look.glasses ?? "none";
  const shirt = look.shirt ?? "plain";
  const hairColor = look.hairColor ?? "#8a5a3a";
  const shirtColor = look.shirtColor ?? "#AFA9EC";
  const bg = look.background;
  const hideMouth = !isGirl && mustache === "broom";
  const height = size * (310 / 260);

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative", className)}
      style={{ width: size, height }}
    >
      {animate ? (
        <style>{`
          @keyframes cute-avatar-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes cute-avatar-twinkle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.3; transform: scale(0.6); }
          }
          .cute-avatar-floaty {
            animation: cute-avatar-bob 3s ease-in-out infinite;
          }
          .cute-avatar-spark {
            animation: cute-avatar-twinkle 2s ease-in-out infinite;
            transform-origin: center;
            transform-box: fill-box;
          }
          @media (prefers-reduced-motion: reduce) {
            .cute-avatar-floaty,
            .cute-avatar-spark {
              animation: none;
            }
          }
        `}</style>
      ) : null}

      <svg
        width={size}
        height={height}
        viewBox="0 0 260 310"
        className="h-full w-full"
        role={label ? undefined : "presentation"}
        xmlns="http://www.w3.org/2000/svg"
      >
        {label ? (
          <>
            <title>{label}</title>
            <desc>
              Customizable chibi character with boy and girl asset sets
            </desc>
          </>
        ) : null}

        {bg ? <rect width="260" height="310" rx="24" fill={bg} /> : null}

        {animate ? (
          <>
            <g className="cute-avatar-spark">
              <path
                d="M34 50 L37 58 L45 61 L37 64 L34 72 L31 64 L23 61 L31 58 Z"
                fill="#FAC775"
              />
            </g>
            <g
              className="cute-avatar-spark"
              style={{ animationDelay: "0.7s" }}
            >
              <path
                d="M224 90 L226 96 L232 98 L226 100 L224 106 L222 100 L216 98 L222 96 Z"
                fill="#F4C0D1"
              />
            </g>
            <g
              className="cute-avatar-spark"
              style={{ animationDelay: "1.3s" }}
            >
              <circle cx="40" cy="150" r="4" fill="#9FE1CB" />
            </g>
            <g
              className="cute-avatar-spark"
              style={{ animationDelay: "0.4s" }}
            >
              <circle cx="222" cy="210" r="4" fill="#CECBF6" />
            </g>
          </>
        ) : null}

        <ellipse cx="130" cy="292" rx="60" ry="10" fill="#000" opacity="0.08" />

        <g className={animate ? "cute-avatar-floaty" : undefined}>
          <g>
            <path
              d="M85 285 L85 245 Q85 218 108 214 L118 212 Q130 220 142 212 L152 214 Q175 218 175 245 L175 285 Q175 290 168 290 L92 290 Q85 290 85 285Z"
              fill={shirtColor}
            />
            <ellipse cx="86" cy="248" rx="12" ry="20" fill={shirtColor} />
            <ellipse cx="174" cy="248" rx="12" ry="20" fill={shirtColor} />
            <circle cx="80" cy="266" r="8" fill="#FBD8B8" />
            <circle cx="180" cy="266" r="8" fill="#FBD8B8" />
            <g>{SHIRT_DECO[shirt](shirtColor)}</g>
            <rect x="120" y="196" width="20" height="20" rx="8" fill="#F5C89E" />
          </g>

          <g>
            <ellipse cx="130" cy="125" rx="72" ry="68" fill="#FBD8B8" />
            <ellipse cx="58" cy="130" rx="9" ry="13" fill="#FBD8B8" />
            <ellipse cx="202" cy="130" rx="9" ry="13" fill="#FBD8B8" />

            <ellipse cx="102" cy="132" rx="14" ry="17" fill="#3a2e26" />
            <ellipse cx="158" cy="132" rx="14" ry="17" fill="#3a2e26" />
            <circle cx="107" cy="126" r="5.5" fill="#fff" />
            <circle cx="163" cy="126" r="5.5" fill="#fff" />
            <circle cx="98" cy="137" r="2.5" fill="#fff" opacity="0.85" />
            <circle cx="154" cy="137" r="2.5" fill="#fff" opacity="0.85" />

            {isGirl ? (
              <g
                stroke="#3a2e26"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              >
                <path d="M88 122 L82 117" />
                <path d="M92 118 L88 112" />
                <path d="M172 122 L178 117" />
                <path d="M168 118 L172 112" />
              </g>
            ) : null}

            <path
              d="M88 108 Q100 102 112 107"
              stroke="#8a6a4a"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M148 107 Q160 102 172 108"
              stroke="#8a6a4a"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />

            <ellipse
              cx="78"
              cy="156"
              rx="12"
              ry="7"
              fill="#F7A8A0"
              opacity="0.7"
            />
            <ellipse
              cx="182"
              cy="156"
              rx="12"
              ry="7"
              fill="#F7A8A0"
              opacity="0.7"
            />
            <ellipse cx="130" cy="150" rx="5" ry="3.5" fill="#F0B58E" />

            {!hideMouth && !isGirl ? (
              <path
                d="M118 164 Q124 172 130 164 Q136 172 142 164"
                stroke="#c96a54"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {isGirl ? (
              <path
                d="M120 164 Q125 171 130 165 Q135 171 140 164"
                stroke="#D4537E"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
            ) : null}
          </g>

          <g>{HAIR_STYLES[hair](hairColor)}</g>
          <g>{!isGirl ? MUSTACHE_STYLES[mustache](hairColor) : null}</g>
          <g>{GLASSES_STYLES[glasses]}</g>
        </g>
      </svg>
    </div>
  );
}

/** Cropped part preview for shop tiles. */
export function CutePartPreview({
  kind,
  style,
  accent,
  className,
}: {
  kind: "hair" | "mustache" | "glasses" | "shirt";
  style: string;
  accent?: string;
  className?: string;
}) {
  const color = accent ?? "#8a5a3a";
  let content: ReactNode = null;
  let viewBox = "0 0 260 310";

  if (kind === "hair") {
    const key = (style in HAIR_STYLES ? style : "fluffy") as CuteHairStyle;
    content = HAIR_STYLES[key](color);
    viewBox = "40 30 180 120";
  } else if (kind === "mustache") {
    const key = (
      style in MUSTACHE_STYLES ? style : "tiny"
    ) as CuteMustacheStyle;
    content = MUSTACHE_STYLES[key](color);
    viewBox = "100 140 60 40";
  } else if (kind === "glasses") {
    const key = (
      style in GLASSES_STYLES ? style : "round"
    ) as CuteGlassesStyle;
    content = GLASSES_STYLES[key];
    viewBox = "55 105 150 55";
  } else {
    const key = (style in SHIRT_DECO ? style : "plain") as CuteShirtStyle;
    content = (
      <>
        <path
          d="M85 285 L85 245 Q85 218 108 214 L118 212 Q130 220 142 212 L152 214 Q175 218 175 245 L175 285 Q175 290 168 290 L92 290 Q85 290 85 285Z"
          fill={color}
        />
        {SHIRT_DECO[key](color)}
      </>
    );
    viewBox = "70 200 120 100";
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
      >
        {content}
      </svg>
    </div>
  );
}

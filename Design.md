# Arc Tailwind Design System

**File purpose:** Tailwind-ready design tokens for the Arc MVP web/iOS-style interface.  
**Product:** Arc — AI Career Coach  
**Visual direction:** Premium, playful, clean, Duolingo-inspired, Linear/Notion-level polish.  
**Mascot:** Arlo, funny eagle coach.

---

## 1. Brand Foundations

Arc should feel:

- Playful, but not childish
- Premium, but not cold
- Motivating, but not stressful
- Clean, but not boring
- Game-like, but still career-focused

Main emotional goal:

> The user should feel: “I know what to do next, and I want to do it.”

---

## 2. Tailwind Color Tokens

Use these as the custom color extension inside `tailwind.config.js`.

```js
colors: {
  arc: {
    purple: {
      50: "#F4F0FF",
      100: "#EDE6FF",
      200: "#D8CCFF",
      300: "#BCA8FF",
      400: "#9B7BFF",
      500: "#6B4EFF",
      600: "#5B3EE8",
      700: "#4B2FD6",
      800: "#35209D",
      900: "#24146F"
    },

    navy: {
      50: "#F6F7FB",
      100: "#EEF0F7",
      200: "#D9DCEB",
      300: "#B8BED4",
      400: "#8F97B8",
      500: "#697294",
      600: "#4A526F",
      700: "#343B55",
      800: "#242A40",
      900: "#18142E",
      950: "#100D22"
    },

    lavender: {
      50: "#FCFAFF",
      100: "#F7F5FF",
      200: "#EFEAFF",
      300: "#E4DBFF",
      400: "#CFC3EC",
      500: "#B3A8D6",
      600: "#8A7CB8",
      700: "#665A91",
      800: "#443B68",
      900: "#2B1B57"
    },

    gold: {
      50: "#FFF9E6",
      100: "#FFF1BF",
      200: "#FFE48A",
      300: "#FFD65A",
      400: "#FFC943",
      500: "#FFB800",
      600: "#E69B00",
      700: "#B87500",
      800: "#855300",
      900: "#563500"
    },

    orange: {
      50: "#FFF3EC",
      100: "#FFE1D1",
      200: "#FFC1A3",
      300: "#FFA071",
      400: "#FF8A3D",
      500: "#FF7A00",
      600: "#E86500",
      700: "#B84D00",
      800: "#853700",
      900: "#552300"
    },

    green: {
      50: "#ECFFF4",
      100: "#D4FFE5",
      200: "#A7F7C6",
      300: "#78EBA5",
      400: "#4FD27E",
      500: "#2DBE65",
      600: "#209B51",
      700: "#19783F",
      800: "#145A31",
      900: "#0E3D22"
    },

    blue: {
      50: "#ECF8FF",
      100: "#D7F0FF",
      200: "#AEE2FF",
      300: "#7ACEFF",
      400: "#3BA5FF",
      500: "#188CFF",
      600: "#006EE6",
      700: "#0054B3",
      800: "#003D80",
      900: "#002852"
    },

    gem: {
      50: "#F8F0FF",
      100: "#F0DBFF",
      200: "#E0B8FF",
      300: "#CC8FFF",
      400: "#B96CFF",
      500: "#A94CFF",
      600: "#8A32E6",
      700: "#6B23B8",
      800: "#4C1885",
      900: "#321052"
    },

    coral: {
      50: "#FFF0EE",
      100: "#FFE0DC",
      200: "#FFC1B8",
      300: "#FF9E91",
      400: "#FF7D6D",
      500: "#FF6D5A",
      600: "#E8513D",
      700: "#B83B2B",
      800: "#85291D",
      900: "#551912"
    }
  }
}
```

---

## 3. Semantic Color Usage

Use semantic names in components so the design remains maintainable.

| Use Case              | Tailwind Token                              |
| --------------------- | ------------------------------------------- |
| App background        | `bg-arc-lavender-100`                       |
| Main card             | `bg-white`                                  |
| Primary text          | `text-arc-navy-900`                         |
| Secondary text        | `text-arc-lavender-700`                     |
| Muted text            | `text-arc-lavender-500`                     |
| Primary button        | `bg-arc-purple-500`                         |
| Primary button shadow | `shadow-[0_6px_0_#4B2FD6]`                  |
| Success/completed     | `text-arc-green-500`                        |
| Error/failed          | `text-arc-coral-500`                        |
| Warning/streak risk   | `text-arc-gold-500`                         |
| XP                    | `text-arc-blue-500`                         |
| Gems                  | `text-arc-gem-500`                          |
| Coins                 | `text-arc-gold-500`                         |
| Locked state          | `bg-arc-lavender-200 text-arc-lavender-500` |

---

## 4. Gradients

Add these as utilities or custom background values.

```js
backgroundImage: {
  "arc-primary": "linear-gradient(180deg, #7B63FF 0%, #6B4EFF 100%)",
  "arc-primary-horizontal": "linear-gradient(90deg, #6B4EFF 0%, #8A6CFF 100%)",
  "arc-soft": "linear-gradient(180deg, #F4F0FF 0%, #FFFFFF 100%)",
  "arc-hero": "linear-gradient(180deg, #EFE7FF 0%, #F7F5FF 48%, #FFFFFF 100%)",
  "arc-reward": "linear-gradient(180deg, #FFC943 0%, #FF8A3D 100%)",
  "arc-boss": "linear-gradient(180deg, #18142E 0%, #35209D 100%)",
  "arc-gem": "linear-gradient(180deg, #B96CFF 0%, #6B4EFF 100%)",
  "arc-success": "linear-gradient(180deg, #4FD27E 0%, #22B86A 100%)",
  "arc-card-glow": "radial-gradient(circle at 50% 0%, rgba(107,78,255,0.18), transparent 55%)"
}
```

---

## 5. Font Family

Recommended production fonts:

### Primary UI Font

Use Apple-native system stack for the actual app and Tailwind web implementation.

```js
fontFamily: {
  sans: [
    "SF Pro Rounded",
    "SF Pro Display",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Inter",
    "system-ui",
    "sans-serif"
  ],
  display: [
    "SF Pro Rounded",
    "Fredoka",
    "Nunito",
    "Inter",
    "system-ui",
    "sans-serif"
  ],
  rounded: [
    "SF Pro Rounded",
    "Nunito",
    "Inter",
    "system-ui",
    "sans-serif"
  ]
}
```

### Optional Web Fonts

For prototype/marketing:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800;900&display=swap"
  rel="stylesheet"
/>
```

Recommended usage:

| Use                   | Font           |
| --------------------- | -------------- |
| Big playful headings  | `font-display` |
| Body text             | `font-sans`    |
| Buttons               | `font-rounded` |
| Badges/ranks          | `font-display` |
| App Store screenshots | `font-display` |

---

## 6. Typography Scale

Add these as custom font sizes.

```js
fontSize: {
  "arc-micro": ["11px", { lineHeight: "14px", letterSpacing: "0.01em" }],
  "arc-caption": ["13px", { lineHeight: "18px" }],
  "arc-small": ["15px", { lineHeight: "21px" }],
  "arc-body": ["17px", { lineHeight: "24px" }],
  "arc-heading": ["22px", { lineHeight: "28px", letterSpacing: "-0.02em" }],
  "arc-title": ["28px", { lineHeight: "34px", letterSpacing: "-0.025em" }],
  "arc-large-title": ["34px", { lineHeight: "41px", letterSpacing: "-0.03em" }],
  "arc-hero": ["56px", { lineHeight: "60px", letterSpacing: "-0.05em" }]
}
```

---

## 7. Spacing System

Use Tailwind default spacing plus these Arc-specific values.

```js
spacing: {
  "safe-top": "env(safe-area-inset-top)",
  "safe-bottom": "env(safe-area-inset-bottom)",
  "18": "4.5rem",
  "22": "5.5rem",
  "26": "6.5rem",
  "30": "7.5rem",
  "screen-ios": "852px"
}
```

Recommended layout spacing:

| Element                   | Value          |
| ------------------------- | -------------- |
| Screen horizontal padding | `px-5` / 20px  |
| Card padding              | `p-4` to `p-6` |
| Section gap               | `gap-4`        |
| Large section gap         | `gap-6`        |
| Input height              | `h-14`         |
| Button height             | `h-14`         |
| Bottom tab height         | `h-[84px]`     |

---

## 8. Border Radius

```js
borderRadius: {
  "arc-xs": "10px",
  "arc-sm": "14px",
  "arc-md": "18px",
  "arc-lg": "22px",
  "arc-xl": "28px",
  "arc-2xl": "32px",
  "arc-phone": "46px",
  "arc-full": "999px"
}
```

Usage:

| Component     | Radius              |
| ------------- | ------------------- |
| Inputs        | `rounded-arc-md`    |
| Buttons       | `rounded-arc-md`    |
| Cards         | `rounded-arc-xl`    |
| Bottom sheets | `rounded-arc-2xl`   |
| Phone mockups | `rounded-arc-phone` |
| Avatars       | `rounded-arc-full`  |

---

## 9. Shadows

```js
boxShadow: {
  "arc-card": "0 8px 24px rgba(70, 40, 150, 0.08)",
  "arc-card-lg": "0 20px 50px rgba(70, 40, 150, 0.16)",
  "arc-button": "0 6px 0 #4B2FD6",
  "arc-button-sm": "0 4px 0 #4B2FD6",
  "arc-soft": "0 12px 30px rgba(107, 78, 255, 0.16)",
  "arc-reward": "0 16px 36px rgba(255, 184, 0, 0.28)",
  "arc-danger": "0 12px 30px rgba(255, 109, 90, 0.22)",
  "arc-inner": "inset 0 0 0 1px rgba(107, 78, 255, 0.10)"
}
```

---

## 10. Border System

```js
borderColor: {
  "arc-soft": "#EDE6FF",
  "arc-card": "rgba(107, 78, 255, 0.10)",
  "arc-focus": "#6B4EFF",
  "arc-error": "#FF6D5A",
  "arc-success": "#4FD27E"
}
```

Common classes:

```html
border border-arc-soft border-2 border-arc-purple-500 border border-arc-card
```

---

## 11. Z-Index Scale

```js
zIndex: {
  "base": "1",
  "raised": "10",
  "nav": "30",
  "modal": "50",
  "toast": "70",
  "system": "100"
}
```

---

## 12. Animation Tokens

```js
transitionTimingFunction: {
  "arc-spring": "cubic-bezier(0.2, 0.9, 0.2, 1)",
  "arc-smooth": "cubic-bezier(0.4, 0, 0.2, 1)"
},
animation: {
  "arc-float": "arcFloat 3.4s ease-in-out infinite",
  "arc-pop": "arcPop 480ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
  "arc-rise": "arcRise 640ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
  "arc-pulse": "arcPulse 2s ease-in-out infinite",
  "arc-shake": "arcShake 500ms ease-in-out both",
  "arc-spin-slow": "spin 4s linear infinite"
},
keyframes: {
  arcFloat: {
    "0%, 100%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-8px)" }
  },
  arcPop: {
    "0%": { opacity: "0", transform: "scale(0.92)" },
    "70%": { transform: "scale(1.04)" },
    "100%": { opacity: "1", transform: "scale(1)" }
  },
  arcRise: {
    "0%": { opacity: "0", transform: "translateY(18px)" },
    "100%": { opacity: "1", transform: "translateY(0)" }
  },
  arcPulse: {
    "0%, 100%": { boxShadow: "0 0 0 0 rgba(107,78,255,0.35)" },
    "50%": { boxShadow: "0 0 0 12px rgba(107,78,255,0)" }
  },
  arcShake: {
    "0%, 100%": { transform: "translateX(0)" },
    "20%": { transform: "translateX(-4px)" },
    "40%": { transform: "translateX(4px)" },
    "60%": { transform: "translateX(-3px)" },
    "80%": { transform: "translateX(3px)" }
  }
}
```

---

## 13. Asset Requirements

Create an `/assets` folder with the following structure.

```text
assets/
├── brand/
│   ├── arc-logo.svg
│   ├── arc-icon.svg
│   ├── arc-app-icon.png
│   └── arc-wordmark.svg
│
├── arlo/
│   ├── arlo-welcome.png
│   ├── arlo-envelope.png
│   ├── arlo-celebrate.png
│   ├── arlo-thinking.png
│   ├── arlo-sleepy.png
│   ├── arlo-boss.png
│   ├── arlo-roast.png
│   └── arlo-graduation.png
│
├── backgrounds/
│   ├── mountain-welcome.png
│   ├── auth-clouds.png
│   ├── roadmap-world.png
│   ├── reward-burst.png
│   └── boss-bg.png
│
├── icons/
│   ├── apple.svg
│   ├── google.svg
│   ├── xp.svg
│   ├── gem.svg
│   ├── coin.svg
│   ├── chest.svg
│   ├── badge.svg
│   └── streak.svg
│
├── badges/
│   ├── first-step.png
│   ├── weekly-warrior.png
│   ├── sql-spark.png
│   ├── comeback-eagle.png
│   ├── night-owl.png
│   ├── early-bird.png
│   ├── quiz-crusher.png
│   ├── project-starter.png
│   ├── four-week-flame.png
│   └── job-ready-eagle.png
│
└── chests/
    ├── common-chest.png
    ├── weekly-chest.png
    ├── boss-chest.png
    └── legendary-chest.png
```

---

## 14. Image Asset Export Guidelines

### Mascot Assets

| Asset          | Format   | Background      | Size        |
| -------------- | -------- | --------------- | ----------- |
| Arlo mascot    | PNG      | Transparent     | 2048px wide |
| Arlo small UI  | PNG/WebP | Transparent     | 512px wide  |
| App Store hero | PNG      | Full background | 2048x2732   |
| Badge icons    | PNG/WebP | Transparent     | 512x512     |
| Chest icons    | PNG/WebP | Transparent     | 1024x1024   |

### Web Recommendations

Use:

- `webp` for production web performance
- `png` for transparent high-quality exports
- `svg` for logos and simple icons

---

## 15. Icon System

Recommended icon libraries:

- `lucide-react` for clean UI icons
- `@tabler/icons-react` for broader icon set
- Custom SVGs for XP, gems, coins, badges, chests

Icon rules:

- Stroke width: 2.25px
- Rounded caps
- Rounded joins
- Use filled icons for rewards
- Use outline icons for navigation
- Active nav icons can be filled or purple

---

## 16. Component Class Standards

### Primary Button

```html
<button
  class="h-14 w-full rounded-arc-md bg-arc-primary text-white font-bold text-arc-body shadow-arc-button active:translate-y-1 active:shadow-arc-button-sm transition-all"
>
  Create Account
</button>
```

Recommended actual Tailwind class:

```html
<button
  class="h-14 w-full rounded-arc-md bg-arc-purple-500 text-white font-bold text-arc-body shadow-arc-button active:translate-y-1 transition-all"
>
  Create Account
</button>
```

### Input

```html
<div
  class="h-16 rounded-arc-md border border-arc-soft bg-white px-4 flex flex-col justify-center shadow-arc-inner"
>
  <label class="text-arc-caption font-semibold text-arc-lavender-700"
    >Email</label
  >
  <input
    class="text-arc-body font-semibold text-arc-navy-900 outline-none bg-transparent"
  />
</div>
```

### Card

```html
<div class="rounded-arc-xl bg-white p-5 shadow-arc-card border border-arc-card">
  ...
</div>
```

### Reward Pill

```html
<div
  class="inline-flex items-center gap-2 rounded-full bg-arc-blue-50 px-3 py-1.5 text-arc-blue-600 font-bold"
>
  <img src="/assets/icons/xp.svg" class="h-4 w-4" />
  +30 XP
</div>
```

---

## 17. Full Tailwind Config Example

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,html}"],
  theme: {
    extend: {
      colors: {
        arc: {
          purple: {
            50: "#F4F0FF",
            100: "#EDE6FF",
            200: "#D8CCFF",
            300: "#BCA8FF",
            400: "#9B7BFF",
            500: "#6B4EFF",
            600: "#5B3EE8",
            700: "#4B2FD6",
            800: "#35209D",
            900: "#24146F",
          },
          navy: {
            50: "#F6F7FB",
            100: "#EEF0F7",
            200: "#D9DCEB",
            300: "#B8BED4",
            400: "#8F97B8",
            500: "#697294",
            600: "#4A526F",
            700: "#343B55",
            800: "#242A40",
            900: "#18142E",
            950: "#100D22",
          },
          lavender: {
            50: "#FCFAFF",
            100: "#F7F5FF",
            200: "#EFEAFF",
            300: "#E4DBFF",
            400: "#CFC3EC",
            500: "#B3A8D6",
            600: "#8A7CB8",
            700: "#665A91",
            800: "#443B68",
            900: "#2B1B57",
          },
          gold: {
            50: "#FFF9E6",
            100: "#FFF1BF",
            200: "#FFE48A",
            300: "#FFD65A",
            400: "#FFC943",
            500: "#FFB800",
            600: "#E69B00",
            700: "#B87500",
            800: "#855300",
            900: "#563500",
          },
          orange: {
            50: "#FFF3EC",
            100: "#FFE1D1",
            200: "#FFC1A3",
            300: "#FFA071",
            400: "#FF8A3D",
            500: "#FF7A00",
            600: "#E86500",
            700: "#B84D00",
            800: "#853700",
            900: "#552300",
          },
          green: {
            50: "#ECFFF4",
            100: "#D4FFE5",
            200: "#A7F7C6",
            300: "#78EBA5",
            400: "#4FD27E",
            500: "#2DBE65",
            600: "#209B51",
            700: "#19783F",
            800: "#145A31",
            900: "#0E3D22",
          },
          blue: {
            50: "#ECF8FF",
            100: "#D7F0FF",
            200: "#AEE2FF",
            300: "#7ACEFF",
            400: "#3BA5FF",
            500: "#188CFF",
            600: "#006EE6",
            700: "#0054B3",
            800: "#003D80",
            900: "#002852",
          },
          gem: {
            50: "#F8F0FF",
            100: "#F0DBFF",
            200: "#E0B8FF",
            300: "#CC8FFF",
            400: "#B96CFF",
            500: "#A94CFF",
            600: "#8A32E6",
            700: "#6B23B8",
            800: "#4C1885",
            900: "#321052",
          },
          coral: {
            50: "#FFF0EE",
            100: "#FFE0DC",
            200: "#FFC1B8",
            300: "#FF9E91",
            400: "#FF7D6D",
            500: "#FF6D5A",
            600: "#E8513D",
            700: "#B83B2B",
            800: "#85291D",
            900: "#551912",
          },
        },
      },

      fontFamily: {
        sans: [
          "SF Pro Rounded",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "SF Pro Rounded",
          "Fredoka",
          "Nunito",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        rounded: [
          "SF Pro Rounded",
          "Nunito",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },

      fontSize: {
        "arc-micro": ["11px", { lineHeight: "14px", letterSpacing: "0.01em" }],
        "arc-caption": ["13px", { lineHeight: "18px" }],
        "arc-small": ["15px", { lineHeight: "21px" }],
        "arc-body": ["17px", { lineHeight: "24px" }],
        "arc-heading": [
          "22px",
          { lineHeight: "28px", letterSpacing: "-0.02em" },
        ],
        "arc-title": [
          "28px",
          { lineHeight: "34px", letterSpacing: "-0.025em" },
        ],
        "arc-large-title": [
          "34px",
          { lineHeight: "41px", letterSpacing: "-0.03em" },
        ],
        "arc-hero": ["56px", { lineHeight: "60px", letterSpacing: "-0.05em" }],
      },

      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        "screen-ios": "852px",
      },

      borderRadius: {
        "arc-xs": "10px",
        "arc-sm": "14px",
        "arc-md": "18px",
        "arc-lg": "22px",
        "arc-xl": "28px",
        "arc-2xl": "32px",i
        "arc-phone": "46px",
        "arc-full": "999px",
      },

      boxShadow: {
        "arc-card": "0 8px 24px rgba(70, 40, 150, 0.08)",
        "arc-card-lg": "0 20px 50px rgba(70, 40, 150, 0.16)",
        "arc-button": "0 6px 0 #4B2FD6",
        "arc-button-sm": "0 4px 0 #4B2FD6",
        "arc-soft": "0 12px 30px rgba(107, 78, 255, 0.16)",
        "arc-reward": "0 16px 36px rgba(255, 184, 0, 0.28)",
        "arc-danger": "0 12px 30px rgba(255, 109, 90, 0.22)",
        "arc-inner": "inset 0 0 0 1px rgba(107, 78, 255, 0.10)",
      },

      backgroundImage: {
        "arc-primary": "linear-gradient(180deg, #7B63FF 0%, #6B4EFF 100%)",
        "arc-primary-horizontal":
          "linear-gradient(90deg, #6B4EFF 0%, #8A6CFF 100%)",
        "arc-soft": "linear-gradient(180deg, #F4F0FF 0%, #FFFFFF 100%)",
        "arc-hero":
          "linear-gradient(180deg, #EFE7FF 0%, #F7F5FF 48%, #FFFFFF 100%)",
        "arc-reward": "linear-gradient(180deg, #FFC943 0%, #FF8A3D 100%)",
        "arc-boss": "linear-gradient(180deg, #18142E 0%, #35209D 100%)",
        "arc-gem": "linear-gradient(180deg, #B96CFF 0%, #6B4EFF 100%)",
        "arc-success": "linear-gradient(180deg, #4FD27E 0%, #22B86A 100%)",
        "arc-card-glow":
          "radial-gradient(circle at 50% 0%, rgba(107,78,255,0.18), transparent 55%)",
      },

      zIndex: {
        base: "1",
        raised: "10",
        nav: "30",
        modal: "50",
        toast: "70",
        system: "100",
      },

      transitionTimingFunction: {
        "arc-spring": "cubic-bezier(0.2, 0.9, 0.2, 1)",
        "arc-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      animation: {
        "arc-float": "arcFloat 3.4s ease-in-out infinite",
        "arc-pop": "arcPop 480ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
        "arc-rise": "arcRise 640ms cubic-bezier(0.2, 0.9, 0.2, 1) both",
        "arc-pulse": "arcPulse 2s ease-in-out infinite",
        "arc-shake": "arcShake 500ms ease-in-out both",
        "arc-spin-slow": "spin 4s linear infinite",
      },

      keyframes: {
        arcFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        arcPop: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "70%": { transform: "scale(1.04)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        arcRise: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        arcPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(107,78,255,0.35)" },
          "50%": { boxShadow: "0 0 0 12px rgba(107,78,255,0)" },
        },
        arcShake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-4px)" },
          "40%": { transform: "translateX(4px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(3px)" },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 18. Recommended Base CSS

Use this in `src/index.css` or `globals.css`.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    @apply bg-arc-lavender-100 text-arc-navy-900 font-sans;
  }

  button {
    -webkit-tap-highlight-color: transparent;
  }

  input,
  textarea {
    @apply outline-none;
  }
}

@layer components {
  .arc-screen {
    @apply min-h-screen bg-arc-lavender-100 px-5 pt-safe-top pb-safe-bottom;
  }

  .arc-card {
    @apply rounded-arc-xl bg-white border border-arc-card shadow-arc-card;
  }

  .arc-primary-button {
    @apply h-14 w-full rounded-arc-md bg-arc-purple-500 text-white font-bold text-arc-body shadow-arc-button active:translate-y-1 transition-all;
  }

  .arc-secondary-button {
    @apply h-13 w-full rounded-arc-md bg-white text-arc-purple-500 font-bold border border-arc-soft shadow-arc-card;
  }

  .arc-input {
    @apply h-16 rounded-arc-md border border-arc-soft bg-white px-4 text-arc-body font-semibold text-arc-navy-900 shadow-arc-inner;
  }
}
```

---

## 19. Install Packages

Recommended packages for a React/Tailwind implementation:

```bash
npm install tailwindcss postcss autoprefixer
npm install lucide-react
npm install clsx tailwind-merge
npm install framer-motion
```

Optional:

```bash
npm install @tabler/icons-react
npm install lottie-react
```

---

## 20. Tailwind Naming Rules

Use readable component naming:

```text
ArcPrimaryButton
ArcSecondaryButton
ArcInput
ArcCard
ArcRewardPill
ArcGemCounter
ArcCoinCounter
ArcProgressRing
ArcMissionCard
ArcRoadmapNode
ArcBadge
ArcChest
ArcArloMessage
```

---

## 21. MVP Asset Checklist

Before development, prepare these minimum assets:

- `arc-logo.svg`
- `arc-icon.svg`
- `arlo-welcome.png`
- `arlo-envelope.png`
- `arlo-celebrate.png`
- `arlo-thinking.png`
- `auth-clouds.png`
- `mountain-welcome.png`
- `google.svg`
- `apple.svg`
- `xp.svg`
- `gem.svg`
- `coin.svg`
- `common-chest.png`
- 10 badge icons

---

## 22. Design Quality Rules

1. Every screen must have one primary CTA.
2. Every card must use consistent radius and shadow.
3. Every reward action should show animation or visual feedback.
4. Arlo should appear in emotionally important moments.
5. Purple is for primary action, not decoration everywhere.
6. Gold is for coins and achievement moments.
7. Gems should always use violet/pink tones.
8. Success states use green.
9. Error states use coral/red.
10. Avoid gray-heavy UI; Arc should feel alive.

---

## 23. Example Page Shell

```tsx
export function ArcPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-arc-lavender-100 text-arc-navy-900 font-sans">
      <div className="mx-auto min-h-screen max-w-[430px] bg-arc-lavender-100 px-5 pt-safe-top pb-safe-bottom">
        {children}
      </div>
    </main>
  );
}
```

---

## 24. Example Auth Button

```tsx
export function ArcPrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-14 w-full rounded-arc-md bg-arc-purple-500 text-white font-bold text-arc-body shadow-arc-button active:translate-y-1 transition-all disabled:opacity-50 disabled:active:translate-y-0"
    >
      {children}
    </button>
  );
}
```

---

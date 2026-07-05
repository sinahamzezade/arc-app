# Arc Project Setup Instructions

You are setting up **Arc**, an AI personal coach app (not a course PWA) that helps
working adults complete a career transformation.

The Next.js app has already been created with `npx create-next-app@latest arc-app`
using: TypeScript, ESLint, Tailwind CSS, `src/` directory, App Router, Turbopack,
import alias `@/*`.

Run all commands below from inside the `arc-app` directory. Complete every step
in order. Do not skip the folder structure step.

---

## 1. Install dependencies

```bash
npm install @heroui/react framer-motion zustand zod react-hook-form @hookform/resolvers @tanstack/react-query
npm install -D @tanstack/react-query-devtools
npm install next-pwa lucide-react clsx tailwind-merge
```

## 2. Configure Tailwind for HeroUI

Edit `tailwind.config.ts` to match:

```ts
import { heroui } from "@heroui/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [heroui()],
};

export default config;
```

## 3. Create provider files

Create `src/app/query-provider.tsx`:

```tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Create `src/app/providers.tsx`:

```tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <HeroUIProvider>{children}</HeroUIProvider>
    </QueryProvider>
  );
}
```

Update `src/app/layout.tsx` to wrap the body content with `<Providers>`:

```tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 4. Create the folder structure

Create these folders (with a placeholder `.gitkeep` or index file if empty):

```
src/
├── app/
│   ├── layout.tsx
│   ├── providers.tsx
│   ├── query-provider.tsx
│   └── (routes)/
├── components/
├── store/          # Zustand stores
├── schemas/        # Zod schemas
├── hooks/          # custom hooks wrapping React Query
└── lib/            # API clients and utilities
```

## 5. Add a starter Zustand store

Create `src/store/useUserStore.ts`:

```ts
import { create } from "zustand";

interface UserState {
  name: string;
  currentRole: string;
  targetRole: string;
  setName: (name: string) => void;
  setCurrentRole: (role: string) => void;
  setTargetRole: (role: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: "",
  currentRole: "",
  targetRole: "",
  setName: (name) => set({ name }),
  setCurrentRole: (currentRole) => set({ currentRole }),
  setTargetRole: (targetRole) => set({ targetRole }),
}));
```

## 6. Add a starter Zod schema + React Hook Form example

Create `src/schemas/onboarding.ts`:

```ts
import { z } from "zod";

export const onboardingSchema = z.object({
  currentRole: z.string().min(2, "Required"),
  targetRole: z.string().min(2, "Required"),
  yearsExperience: z.coerce.number().min(0),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
```

Create `src/components/OnboardingForm.tsx`:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@heroui/react";
import {
  onboardingSchema,
  type OnboardingFormData,
} from "@/schemas/onboarding";

export default function OnboardingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = (data: OnboardingFormData) => {
    console.log(data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 max-w-md"
    >
      <Input
        label="Current Role"
        {...register("currentRole")}
        isInvalid={!!errors.currentRole}
        errorMessage={errors.currentRole?.message}
      />
      <Input
        label="Target Role"
        {...register("targetRole")}
        isInvalid={!!errors.targetRole}
        errorMessage={errors.targetRole?.message}
      />
      <Input
        type="number"
        label="Years of Experience"
        {...register("yearsExperience")}
        isInvalid={!!errors.yearsExperience}
        errorMessage={errors.yearsExperience?.message}
      />
      <Button type="submit" color="primary">
        Continue
      </Button>
    </form>
  );
}
```

## 7. Add a starter React Query hook

Create `src/hooks/useCoachSession.ts`:

```ts
import { useQuery } from "@tanstack/react-query";

async function fetchCoachSession() {
  const res = await fetch("/api/coach-session");
  if (!res.ok) throw new Error("Failed to fetch coach session");
  return res.json();
}

export function useCoachSession() {
  return useQuery({
    queryKey: ["coach-session"],
    queryFn: fetchCoachSession,
  });
}
```

## 8. PWA configuration (do this last, only after step 1–7 work)

Edit `next.config.ts`:

```ts
import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
```

Add a minimal `public/manifest.json`:

```json
{
  "name": "Arc",
  "short_name": "Arc",
  "description": "Arc is an AI personal coach for career transformation.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": []
}
```

Reference it in `src/app/layout.tsx` metadata:

```tsx
export const metadata = {
  title: "Arc",
  description: "Arc is an AI personal coach for career transformation.",
  manifest: "/manifest.json",
};
```

## 9. Verify

```bash
npm run dev
```

Confirm the app boots at `http://localhost:3000` with no console errors, and
that `OnboardingForm` renders correctly if added to a test page.

---

### Notes for the AI agent

- Use TypeScript everywhere; no `.js` files.
- Keep all client-interactive components marked `"use client"`.
- Do not remove the ESLint or Tailwind config already generated by `create-next-app`.
- If any package version conflict occurs, prefer the latest stable release compatible with Next.js (App Router).

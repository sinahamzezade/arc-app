"use client";

import {
  Activity,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import HomeScreen from "@/components/HomeScreen";
import PathScreen from "@/components/PathScreen";
import ProfileScreen from "@/components/ProfileScreen";
import BattleHubScreen from "@/components/battle/BattleHubScreen";
import { BattleHubSkeleton } from "@/components/battle/BattleHubSkeleton";
import StudyHubScreen from "@/components/study/StudyHubScreen";
import { PullToRefresh } from "@/components/PullToRefresh";

const TAB_SCREENS = {
  "/home": HomeScreen,
  "/path": PathScreen,
  "/battle": BattleHubScreen,
  "/study": StudyHubScreen,
  "/profile": ProfileScreen,
} as const;

export type MainTabHref = keyof typeof TAB_SCREENS;

const TAB_HREFS = Object.keys(TAB_SCREENS) as MainTabHref[];

/** Exact tab roots only — nested routes (e.g. /path/graduation) use `children`. */
export function matchMainTab(pathname: string): MainTabHref | null {
  return pathname in TAB_SCREENS ? (pathname as MainTabHref) : null;
}

function TabScreen({ href }: { href: MainTabHref }) {
  const Screen = TAB_SCREENS[href] as ComponentType;
  if (href === "/battle") {
    return (
      <Suspense fallback={<BattleHubSkeleton />}>
        <Screen />
      </Suspense>
    );
  }
  return <Screen />;
}

/**
 * Keeps main tab screens mounted via React `<Activity>` so tab switches
 * do not remount / flash route `loading.tsx`. Nested (main) routes still
 * render through `children`.
 */
export function MainTabShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = matchMainTab(pathname);
  const [visited, setVisited] = useState<Partial<Record<MainTabHref, true>>>(
    () => (active ? { [active]: true } : {}),
  );

  useEffect(() => {
    if (!active) return;
    setVisited((prev) => (prev[active] ? prev : { ...prev, [active]: true }));
  }, [active]);

  const renderVisited = active ? { ...visited, [active]: true as const } : visited;

  return (
    <>
      <PullToRefresh enabled={Boolean(active)}>
        {TAB_HREFS.map((href) => {
          if (!renderVisited[href]) return null;
          return (
            <Activity
              key={href}
              mode={href === active ? "visible" : "hidden"}
              name={`main-tab:${href}`}
            >
              <TabScreen href={href} />
            </Activity>
          );
        })}
      </PullToRefresh>
      {!active ? children : null}
    </>
  );
}

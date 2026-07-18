import type { Metadata } from "next";
import NotFoundScreen from "@/components/NotFoundScreen";

export const metadata: Metadata = {
  title: "404 — Lost path | Arlo",
  description: "This page isn't on your roadmap. Arlo will get you back.",
};

export default function NotFound() {
  return <NotFoundScreen />;
}

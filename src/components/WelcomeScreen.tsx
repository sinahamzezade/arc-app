"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Link as ArcLink } from "@/components/ui";
import { assets } from "@/lib/assets";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={assets.arlo.welcome}
          alt="Arlo the eagle welcoming you to Arc"
          fill
          priority
          className="object-cover object-bottom"
          sizes="(max-width: 448px) 100vw, 448px"
        />
        <div className="absolute inset-0 bg-linear-to-b from-arc-lavender-100/95 via-arc-lavender-100/30 via-25% to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-arc-navy-950/55 to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col px-5 pt-safe-top pb-safe-bottom">
        <header className="pt-12 text-center">
          <h1 className="font-display text-arc-hero text-arc-purple-500">
            Arc
          </h1>
          <h2 className="mt-1 font-display text-arc-heading font-bold text-arc-navy-900">
            Your AI Career Coach
          </h2>
          <p className="mt-2 text-arc-body text-arc-navy-900">
            Learn. Grow. Land your dream job.
          </p>
        </header>

        <div className="flex-1" />

        <footer className="pb-8">
          <Button
            fullWidth
            variant="primary"
            onPress={() => router.push("/register")}
            className="h-14 rounded-arc-md bg-arc-purple-500 font-rounded text-arc-body font-bold shadow-arc-button transition-all active:translate-y-px active:shadow-arc-button-sm"
          >
            Get Started
          </Button>
          <p className="mt-5 text-center text-arc-small text-white/90">
            Already have an account?{" "}
            <ArcLink
              href="/login"
              className="font-bold text-arc-lavender-200 underline-offset-2 hover:underline"
            >
              Log in
            </ArcLink>
          </p>
        </footer>
      </div>
    </div>
  );
}

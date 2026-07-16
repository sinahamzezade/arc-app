"use client";

import { useEffect, useState } from "react";

export type VisualViewportFrame = {
  /** Offset of visual viewport from layout viewport top (iOS keyboard scroll). */
  top: number;
  /** Visible height — shrinks when soft keyboard opens. */
  height: number;
  /** True when keyboard (or browser chrome) ate ~80px+ of height. */
  keyboardOpen: boolean;
};

const KEYBOARD_THRESHOLD_PX = 80;

function readFrame(): VisualViewportFrame {
  if (typeof window === "undefined") {
    return { top: 0, height: 0, keyboardOpen: false };
  }
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  const top = vv?.offsetTop ?? 0;
  const layoutH = window.innerHeight;
  const keyboardOpen = layoutH - height > KEYBOARD_THRESHOLD_PX;
  return { top, height, keyboardOpen };
}

/**
 * Pin a fixed fullscreen shell to the *visual* viewport.
 * Fixes iOS Safari / Chrome mobile gap between composer and soft keyboard,
 * and keeps header glued to the visible top while keyboard is open.
 */
export function useVisualViewportFrame(): VisualViewportFrame {
  const [frame, setFrame] = useState<VisualViewportFrame>(() => readFrame());

  useEffect(() => {
    const update = () => setFrame(readFrame());
    update();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    // iOS sometimes fires orientationchange without a clean resize.
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return frame;
}

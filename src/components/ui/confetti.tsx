"use client";

import type { ReactNode } from "react";
import React, {
  createContext,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from "canvas-confetti";
import confetti from "canvas-confetti";

type Api = {
  fire: (options?: ConfettiOptions) => void;
};

type Props = React.ComponentPropsWithRef<"canvas"> & {
  options?: ConfettiOptions;
  globalOptions?: ConfettiGlobalOptions;
  manualstart?: boolean;
  children?: ReactNode;
};

export type ConfettiRef = Api | null;

const ConfettiContext = createContext<Api>({} as Api);

const ConfettiComponent = forwardRef<ConfettiRef, Props>((props, ref) => {
  const {
    options,
    globalOptions = { resize: true, useWorker: true },
    manualstart = false,
    children,
    ...rest
  } = props;
  const instanceRef = useRef<ConfettiInstance | null>(null);

  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return;
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        });
      } else {
        if (instanceRef.current) {
          instanceRef.current.reset();
          instanceRef.current = null;
        }
      }
    },
    [globalOptions],
  );

  const fire = useCallback(
    async (opts: ConfettiOptions = {}) => {
      try {
        await instanceRef.current?.({ ...options, ...opts });
      } catch (error) {
        console.error("Confetti error:", error);
      }
    },
    [options],
  );

  const api = useMemo(() => ({ fire }), [fire]);

  useImperativeHandle(ref, () => api, [api]);

  useEffect(() => {
    if (manualstart) return;
    void fire();
  }, [manualstart, fire]);

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  );
});

ConfettiComponent.displayName = "Confetti";

export const Confetti = ConfettiComponent;

/** Side-cannon burst — celebration on lesson complete. */
export function fireLessonConfetti() {
  const colors = ["#ffc928", "#6b4eff", "#ff8a3d", "#2dbe65", "#ffffff"];
  const end = Date.now() + 2200;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 58,
      startVelocity: 55,
      origin: { x: 0, y: 0.65 },
      colors,
      zIndex: 40,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 58,
      startVelocity: 55,
      origin: { x: 1, y: 0.65 },
      colors,
      zIndex: 40,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();

  confetti({
    particleCount: 48,
    spread: 80,
    startVelocity: 38,
    origin: { x: 0.5, y: 0.35 },
    colors,
    shapes: ["circle", "square"],
    zIndex: 40,
    disableForReducedMotion: true,
  });
}

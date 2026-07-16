"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const softSpring = { type: "spring" as const, stiffness: 420, damping: 32 };

type Props = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

/**
 * Full-screen chat photo viewer — pinch / wheel / buttons zoom, drag pan.
 */
export function ChatImageLightbox({
  src,
  alt = "Chat photo",
  open,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
    moved: boolean;
  } | null>(null);
  const lastTapRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) {
      resetView();
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, resetView]);

  function clampScale(next: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
  }

  function zoomBy(delta: number) {
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    zoomBy(delta);
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
      moved: false,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || scale <= MIN_SCALE) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    setOffset({ x: drag.ox + dx, y: drag.oy + dy });
  }

  function onPointerUp(e: React.PointerEvent) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag || drag.moved) return;

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (scale > MIN_SCALE) {
        resetView();
      } else {
        setScale(2.5);
      }
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    // Single tap on backdrop area handled by overlay; image tap ignored unless double
    void e;
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { dist, scale };
      dragRef.current = null;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = dist / pinchRef.current.dist;
      const next = clampScale(pinchRef.current.scale * ratio);
      setScale(next);
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
    }
  }

  function onTouchEnd() {
    pinchRef.current = null;
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="chat-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-80 flex flex-col bg-[#0f1220]/94"
          onClick={() => {
            if (scale <= MIN_SCALE) onClose();
            else resetView();
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
            <p className="pointer-events-none text-[11px] font-extrabold tracking-[0.12em] text-white/50 uppercase">
              Pinch or scroll to zoom
            </p>
            <button
              type="button"
              aria-label="Close photo"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-3"
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={softSpring}
              className="flex max-h-full max-w-full items-center justify-center"
            >
              {/* Blob URL — next/image not applicable */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => {
                  dragRef.current = null;
                }}
                style={{
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                }}
                className={cn(
                  "max-h-[min(86dvh,900px)] max-w-full select-none object-contain will-change-transform",
                  scale > 1
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-zoom-in",
                )}
                draggable={false}
              />
            </motion.div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 pb-[calc(env(safe-area-inset-bottom)+16px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Zoom out"
              disabled={scale <= MIN_SCALE}
              onClick={() => zoomBy(-0.5)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-opacity hover:bg-white/18 disabled:cursor-default disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
            >
              <Minus className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <span className="min-w-14 text-center text-[12px] font-extrabold tabular-nums text-white/70">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              disabled={scale >= MAX_SCALE}
              onClick={() => zoomBy(0.5)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition-opacity hover:bg-white/18 disabled:cursor-default disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffc928]"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, X, ZoomIn } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getCroppedAvatarFile } from "@/lib/avatar/crop-image";

type AvatarCropModalProps = {
  imageSrc: string;
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

/**
 * Circular crop + zoom sheet before avatar upload.
 */
export function AvatarCropModal({
  imageSrc,
  open,
  busy = false,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropping, setCropping] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || cropping || busy) return;
    setCropping(true);
    try {
      const file = await getCroppedAvatarFile(imageSrc, croppedAreaPixels);
      onConfirm(file);
    } catch {
      onCancel();
    } finally {
      setCropping(false);
    }
  };

  const locked = busy || cropping;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close crop"
            className="absolute inset-0 cursor-pointer"
            disabled={locked}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Crop profile photo"
            className="relative z-[1] flex w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-[#0f1220] text-white shadow-[0_-12px_40px_rgba(0,0,0,0.45)] sm:rounded-[28px]"
            initial={{ y: 40, opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
          >
            <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] pb-2">
              <button
                type="button"
                disabled={locked}
                onClick={onCancel}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white disabled:opacity-50"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <div className="min-w-0 text-center">
                <p className="text-[10px] font-black tracking-[0.14em] text-[#ffc928] uppercase">
                  Crop
                </p>
                <p className="text-[13px] font-bold text-white/45">
                  Drag · pinch · zoom
                </p>
              </div>
              <button
                type="button"
                disabled={locked || !croppedAreaPixels}
                onClick={() => void handleConfirm()}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-arc-purple-500 text-white shadow-[0_3px_0_#4b2fd6] disabled:opacity-50"
                aria-label="Use photo"
              >
                <Check className="h-5 w-5" strokeWidth={2.75} />
              </button>
            </div>

            <div className="relative mx-4 mt-2 h-[min(58vh,360px)] overflow-hidden rounded-[22px] bg-[#1a1e30]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="horizontal-cover"
                classes={{
                  containerClassName: "rounded-[22px]",
                  cropAreaClassName: "!border-[#ffc928] !border-[3px]",
                }}
              />
            </div>

            <div className="px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
              <div className="flex items-center gap-3">
                <ZoomIn
                  className="h-4 w-4 shrink-0 text-white/40"
                  strokeWidth={2.5}
                  aria-hidden
                />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  disabled={locked}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  aria-label="Zoom"
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-arc-purple-500 disabled:opacity-50 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ffc928] [&::-webkit-slider-thumb]:shadow-[0_2px_0_#c79a2e]"
                />
              </div>
              <button
                type="button"
                disabled={locked || !croppedAreaPixels}
                onClick={() => void handleConfirm()}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-[16px] bg-arc-purple-500 font-display text-[16px] font-bold text-white shadow-[0_4px_0_#4b2fd6] disabled:opacity-60"
              >
                {locked ? "Saving…" : "Use photo"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

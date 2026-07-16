/** Compress image to JPEG ≤ maxEdge px / maxBytes for study chat upload. */
export async function compressStudyImage(
  file: File,
  opts: { maxEdge?: number; maxBytes?: number; quality?: number } = {},
): Promise<Blob> {
  const maxEdge = opts.maxEdge ?? 1280;
  const maxBytes = opts.maxBytes ?? 2 * 1024 * 1024;
  const quality = opts.quality ?? 0.82;

  if (!file.type.startsWith("image/")) {
    throw new Error("Not an image");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas unavailable");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let q = quality;
  let blob: Blob | null = null;
  for (let i = 0; i < 6; i++) {
    blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", q),
    );
    if (!blob) break;
    if (blob.size <= maxBytes) return blob;
    q = Math.max(0.45, q - 0.12);
  }
  if (!blob || blob.size > maxBytes) {
    throw new Error("Image too large after compress");
  }
  return blob;
}

export const STUDY_VOICE_MAX_MS = 60_000;

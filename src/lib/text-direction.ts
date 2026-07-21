/**
 * Detect dominant writing direction for chat / lesson copy.
 * Arabic script (incl. Farsi/Persian) + Hebrew → rtl when they outnumber Latin letters.
 */
const RTL_CHAR =
  /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const LTR_CHAR = /[A-Za-z\u00C0-\u024F]/g;

export type TextDirection = "ltr" | "rtl";

export function detectTextDirection(text: string): TextDirection {
  const sample = text.replace(/[*`~_#[\]()>|-]/g, " ");
  const rtl = sample.match(RTL_CHAR)?.length ?? 0;
  const ltr = sample.match(LTR_CHAR)?.length ?? 0;
  if (rtl === 0) return "ltr";
  return rtl >= ltr ? "rtl" : "ltr";
}

export function textDirectionClass(dir: TextDirection): string {
  return dir === "rtl" ? "text-right" : "text-left";
}

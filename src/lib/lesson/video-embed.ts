/** Resolve a lesson resource URL to an in-app iframe embed src when possible. */

export type VideoEmbed =
  | { kind: "embed"; src: string; provider: "youtube" | "vimeo" }
  | { kind: "external"; href: string };

function youtubeId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id || null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (
      parts[0] === "embed" ||
      parts[0] === "shorts" ||
      parts[0] === "live" ||
      parts[0] === "v"
    ) {
      return parts[1] ?? null;
    }
  }
  return null;
}

function vimeoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "");
  if (host === "player.vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[0] === "video" ? (parts[1] ?? null) : null;
  }
  if (host === "vimeo.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    // /123456 or /video/123456
    if (parts[0] === "video") return parts[1] ?? null;
    if (parts[0] && /^\d+$/.test(parts[0])) return parts[0];
  }
  return null;
}

/** Parse http(s) lesson URLs into embeddable iframe src or external fallback. */
export function resolveVideoEmbed(rawUrl: string | null | undefined): VideoEmbed | null {
  if (!rawUrl?.startsWith("http")) return null;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const yt = youtubeId(url);
  if (yt) {
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      // Keep playback inside the iframe; avoid top-level navigations.
      fs: "1",
    });
    return {
      kind: "embed",
      provider: "youtube",
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?${params}`,
    };
  }

  const vim = vimeoId(url);
  if (vim) {
    return {
      kind: "embed",
      provider: "vimeo",
      src: `https://player.vimeo.com/video/${encodeURIComponent(vim)}`,
    };
  }

  return { kind: "external", href: rawUrl };
}

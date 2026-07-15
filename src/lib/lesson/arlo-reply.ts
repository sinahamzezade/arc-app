/**
 * Some coach models leak chain-of-thought as `<think>…</think>` blocks
 * (occasionally HTML-escaped) at the start of the reply. Strip them so
 * only the actual answer reaches the UI.
 */
export function sanitizeArloReply(raw: string): string {
  let text = raw;

  // Closed blocks — raw or HTML-escaped, case-insensitive.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  text = text.replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/gi, "");

  // Unclosed opening tag (truncated stream) — drop everything after it.
  text = text.replace(/(?:<think>|&lt;think&gt;)[\s\S]*$/i, "");

  // Stray orphan closing tag.
  text = text.replace(/<\/think>|&lt;\/think&gt;/gi, "");

  return text.trim();
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  detectTextDirection,
  textDirectionClass,
  type TextDirection,
} from "@/lib/text-direction";

/**
 * Lightweight inline markdown for lesson / chat copy:
 * `**bold**`, `*italic*`, `` `code` ``, `~~strike~~`.
 * Unescapes common backslash-escaped markers from CMS dumps.
 */
export function renderInlineMarkdown(raw: string): ReactNode[] {
  const text = unescapeMarkdown(raw);
  const nodes: ReactNode[] = [];
  // Split keeping delimiters: **...**, ~~...~~, *...*, `...`
  const re = /(\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key++} className="font-extrabold text-inherit">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      nodes.push(
        <s key={key++} className="text-inherit opacity-80">
          {token.slice(2, -2)}
        </s>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded-md bg-black/8 px-1.5 py-0.5 font-mono text-[0.92em] font-semibold"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else {
      nodes.push(token);
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes.length ? nodes : [text];
}

function unescapeMarkdown(input: string): string {
  return input
    .replace(/\\([*_`~])/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function InlineMarkdown({
  text,
  className,
  as: Tag = "span",
  dir = "auto",
}: {
  text: string;
  className?: string;
  as?: "span" | "p";
  /**
   * `auto` = dominant script (Farsi/Arabic/Hebrew → rtl).
   * Explicit `ltr` / `rtl` overrides.
   */
  dir?: "auto" | TextDirection;
}) {
  const resolved: TextDirection =
    dir === "auto" ? detectTextDirection(text) : dir;

  return (
    <Tag
      dir={resolved}
      className={cn(
        "block w-full",
        textDirectionClass(resolved),
        className,
      )}
    >
      {renderInlineMarkdown(text)}
    </Tag>
  );
}

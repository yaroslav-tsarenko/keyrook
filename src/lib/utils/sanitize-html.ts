const ALLOWED_TAGS = new Set(["p", "br", "ul", "ol", "li", "strong", "em", "h3", "h4", "table", "thead", "tbody", "tr", "th", "td", "blockquote"]);

const TAG_ALIASES: Record<string, string> = {
  b: "strong",
  i: "em",
  h1: "h3",
  h2: "h3",
  h5: "h4",
  h6: "h4",
  div: "p",
  section: "p",
};

const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template|svg|math|form|textarea|select|button|head|title)\b[\s\S]*?<\/\1\s*>/gi;

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/g;

const ENTITY = /&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#x[0-9a-fA-F]{1,6});/y;

function escapeText(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "<") out += "&lt;";
    else if (ch === ">") out += "&gt;";
    else if (ch === '"') out += "&quot;";
    else if (ch === "&") {
      ENTITY.lastIndex = i;
      out += ENTITY.test(text) ? "&" : "&amp;";
    } else out += ch;
  }
  return out;
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  const source = input.replace(/<!--[\s\S]*?-->/g, "").replace(DROP_WITH_CONTENT, "");
  let out = "";
  let last = 0;
  TAG.lastIndex = 0;
  for (let match = TAG.exec(source); match; match = TAG.exec(source)) {
    out += escapeText(source.slice(last, match.index));
    last = match.index + match[0].length;
    const raw = match[2].toLowerCase();
    const tag = TAG_ALIASES[raw] ?? raw;
    if (!ALLOWED_TAGS.has(tag)) continue;
    if (tag === "br") out += "<br>";
    else out += match[1] ? `</${tag}>` : `<${tag}>`;
  }
  out += escapeText(source.slice(last));
  return out.replace(/<p>\s*<\/p>/g, "").trim();
}

const NAMED_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", deg: "°", times: "×" };

export function htmlToText(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(DROP_WITH_CONTENT, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|tr|div)>/gi, ". ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
      if (code[0] === "#") {
        const n = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) ? String.fromCodePoint(n) : " ";
      }
      return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/([.!?:])\.+/g, "$1")
    .replace(/^[\s.]+|[\s]+$/g, "")
    .trim();
}

export function clampText(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const sentenceEnd = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "), slice.lastIndexOf("? "));
  if (sentenceEnd >= max * 0.5) return slice.slice(0, sentenceEnd + 1);
  const wordEnd = slice.slice(0, max - 1).lastIndexOf(" ");
  return `${slice.slice(0, wordEnd > 0 ? wordEnd : max - 1).replace(/[\s,.;:–—-]+$/, "")}…`;
}

export function extractLabelledSpecs(html: string | null | undefined): { label: string; value: string }[] {
  if (!html) return [];
  const specs: { label: string; value: string }[] = [];
  const LI = /<li\b[^>]*>\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>\s*:?\s*([\s\S]*?)<\/li>/gi;
  for (let m = LI.exec(html); m; m = LI.exec(html)) {
    const label = htmlToText(m[2]).replace(/[:\s]+$/, "");
    const value = htmlToText(m[3]).replace(/^[:\s]+/, "").replace(/\.$/, "");
    if (label && value && label.length <= 40) specs.push({ label, value });
  }
  return specs;
}

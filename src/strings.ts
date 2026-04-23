export function stripHtml(html: string) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

/**
 * Wikisource verse fragments often contain literal `&#x9ed1;`-style references after tags are stripped.
 * Decode numeric + named HTML entities so they render as real characters (e.g. 黑), not raw escapes.
 */
export function decodeHtmlCharacterReferences(str: string): string {
  if (typeof document === "undefined") {
    return str
      .replace(/&#x([0-9a-fA-F]{1,6});/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d{1,7});/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
  }
  const ta = document.createElement("textarea");
  ta.innerHTML = str;
  return ta.value;
}

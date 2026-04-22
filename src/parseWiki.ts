import { initialMichaelHanQuoteState, westernPunctuationToCjk } from "./westernToCjkPunctuation";

/** Parse `{{verse|…}}` inner text → chapter number + verse label. */
export function parseVerseInner(inner: string) {
  const s = inner.trim();
  if (s.includes("chapter=")) {
    let chapter = NaN;
    let verse = "";
    for (const part of s.split("|")) {
      const mc = part.match(/^\s*chapter\s*=\s*(\d+)\s*$/i);
      const mv = part.match(/^\s*verse\s*=\s*(.+)$/i);
      if (mc) chapter = parseInt(mc[1], 10);
      if (mv) verse = mv[1].trim();
    }
    return { chapter, verse };
  }
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
    const chapter = parseInt(parts[0], 10);
    let rest = parts.slice(1).join("|");
    if (/^verse\s*=/i.test(rest)) rest = rest.replace(/^verse\s*=\s*/i, "").trim();
    return { chapter, verse: rest };
  }
  return { chapter: NaN, verse: "" };
}

export function verseSortKey(verseLabel: string) {
  const m = String(verseLabel).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Sentinel characters (Unicode Private Use Area) embedded in cleaned verse text
 * to carry Wikisource annotation through to the rendering layer.
 *
 *   {{ul|name}}  →  UL_OPEN + name + UL_CLOSE   (proper noun — 專名號)
 *   {{du|name}}  →  DU_OPEN + name + DU_CLOSE   (place  name — 地名號)
 *
 * These are consumed by renderZhWithProperNouns() in properNounSegment.tsx.
 * Book titles detected by the trie override whatever sentinel marks cover the
 * same span (e.g. "以賽亞書" beats the {{ul|以賽亞}} + "書" split).
 */
export const UL_OPEN  = "\uE001";
export const UL_CLOSE = "\uE002";
export const DU_OPEN  = "\uE003";
export const DU_CLOSE = "\uE004";

export function cleanWikiVerseText(raw: string) {
  let t = raw;
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");
  t = t.replace(/\[\[([^\]]+)\]\]/g, "$1");
  // Wrap {{ul|name}} and {{du|name}} with sentinels BEFORE the generic
  // single-pipe extractor runs, so their annotation survives cleaning.
  t = t.replace(/\{\{ul\|([^|{}]+)\}\}/g, `${UL_OPEN}$1${UL_CLOSE}`);
  t = t.replace(/\{\{du\|([^|{}]+)\}\}/g, `${DU_OPEN}$1${DU_CLOSE}`);
  // Extract display text from remaining single-pipe templates (run twice for
  // adjacent occurrences left after the ul/du pass).
  t = t.replace(/\{\{[^|{}]+\|([^|{}]+)\}\}/g, "$1");
  t = t.replace(/\{\{[^|{}]+\|([^|{}]+)\}\}/g, "$1");
  // Remove any remaining templates (multi-arg, no content, etc.).
  t = t.replace(/\{\{[^}]*\}\}/g, "");
  t = t.replace(/[ \t\u3000]+/g, " ").trim();
  return t;
}

/** 國漢文: wiki cleanup + Western ASCII punctuation → fullwidth CJK forms (single verse; no cross-verse quote carry). */
export function cleanMichaelHanVerseText(raw: string): string {
  return westernPunctuationToCjk(cleanWikiVerseText(raw)).text;
}

export type WikiVerse = { verse: string; text: string };

/**
 * Han Wiki {@link https://wiki.michaelhan.net 국한문성경} page wikitext uses `<sup>chapter:verse</sup>`
 * markers (not `{{verse|…}}`).
 */
export function extractMichaelHanVersesForChapter(
  wikitext: string,
  targetChapter: number,
  cleanVerseText: (raw: string) => string = cleanMichaelHanVerseText,
): WikiVerse[] {
  const found: WikiVerse[] = [];
  const re = /<sup>(\d+):(\d+)<\/sup>/gi;
  let m: RegExpExecArray | null;
  /** So a `` ` `` in verse N and closing `'` in verse N+1 still become 「…」 (not a stray 「 from `'`). */
  let hanQuoteState = initialMichaelHanQuoteState();
  const useHanQuoteCarry = cleanVerseText === cleanMichaelHanVerseText;
  while ((m = re.exec(wikitext)) !== null) {
    const chapter = parseInt(m[1]!, 10);
    if (chapter !== targetChapter) continue;
    const verseNum = parseInt(m[2]!, 10);
    const textStart = m.index + m[0].length;
    const rest = wikitext.slice(textStart);
    const next = rest.search(/<sup>\d+:\d+<\/sup>/i);
    const rawText = next < 0 ? rest : rest.slice(0, next);
    if (useHanQuoteCarry) {
      const stripped = cleanWikiVerseText(rawText);
      const { text, quoteState } = westernPunctuationToCjk(stripped, hanQuoteState);
      hanQuoteState = quoteState;
      found.push({ verse: String(verseNum), text });
    } else {
      found.push({ verse: String(verseNum), text: cleanVerseText(rawText) });
    }
  }
  found.sort(
    (a, b) =>
      verseSortKey(a.verse) - verseSortKey(b.verse) ||
      String(a.verse).localeCompare(String(b.verse), "zh-Hant"),
  );
  return found;
}

export function extractVersesForChapter(
  wikitext: string,
  targetChapter: number,
  cleanVerseText: (raw: string) => string = cleanWikiVerseText,
): WikiVerse[] {
  const re = /\{\{verse\|([^}]+)\}\}/g;
  const found: WikiVerse[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(wikitext)) !== null) {
    const inner = m[1];
    const { chapter, verse } = parseVerseInner(inner);
    if (chapter !== targetChapter || !verse) continue;

    const start = m.index + m[0].length;
    const rest = wikitext.slice(start);
    let end = rest.length;
    const c0 = rest.indexOf("{{verse|");
    const c1 = rest.indexOf("{{gototop}}");
    const c2 = rest.search(/\n==[^=\s][^\n]*==/);
    const c3 = rest.indexOf("\n<p>{{verse|");
    for (const c of [c0, c1, c2, c3]) {
      if (c >= 0 && c < end) end = c;
    }
    const rawText = rest.slice(0, end);
    found.push({ verse, text: cleanVerseText(rawText) });
  }
  found.sort(
    (a, b) =>
      verseSortKey(a.verse) - verseSortKey(b.verse) ||
      String(a.verse).localeCompare(String(b.verse), "zh-Hant"),
  );
  return found;
}

import type { WikiVerse } from "./parseWiki";
import { verseSortKey } from "./parseWiki";
import { chapterToKanjiTitle } from "./chapterKanji";
import { cleanMeijiVerseText } from "./parseMeiji";

/**
 * Slice wikitext for one chapter heading `==第N章==` (Taisho 4 NT uses Chinese numerals in headings).
 */
export function sliceTaisho4ChapterSection(wikitext: string, chapter: number): string {
  const kn = chapterToKanjiTitle(chapter);
  const hdr = `第${kn}章`;
  const re = new RegExp(`^==\\s*${hdr}\\s*==\\s*$`, "gm");
  const m = re.exec(wikitext);
  if (!m) return "";
  const start = m.index + m[0].length;
  const tail = wikitext.slice(start);
  const next = tail.search(/\n==[^=\n][^\n]*==/);
  const body = next >= 0 ? tail.slice(0, next) : tail;
  return body;
}

/**
 * Parse verse lines in a Taisho chapter slice: `[1] …`, `2 …`, optional `<br />`.
 */
export function extractVersesTaisho4Chapter(sectionWikitext: string): WikiVerse[] {
  const found: WikiVerse[] = [];
  const lines = sectionWikitext.split(/\r?\n/);
  const verseRe = /^(?:\[(\d{1,3})\]|(\d{1,3}))\s*(.*)$/;
  for (const rawLine of lines) {
    const line = rawLine.replace(/<br\s*\/?>/gi, " ").trim();
    if (!line || line.startsWith("=")) continue;
    if (/^※\d/.test(line)) continue;
    const m = line.match(verseRe);
    if (!m) continue;
    const verse = m[1] ?? m[2];
    const body = m[3];
    if (!verse || body == null) continue;
    found.push({ verse, text: cleanMeijiVerseText(body) });
  }
  found.sort(
    (a, b) =>
      verseSortKey(a.verse) - verseSortKey(b.verse) ||
      String(a.verse).localeCompare(String(b.verse), "ja"),
  );
  return found;
}

export function extractTaisho4NtChapterFromBooks(concatWikitext: string, chapter: number): WikiVerse[] {
  const section = sliceTaisho4ChapterSection(concatWikitext, chapter);
  if (!section.trim()) return [];
  return extractVersesTaisho4Chapter(section);
}

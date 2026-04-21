import { fetchJaWikisourceWikitext } from "./jaWikisource";
import { extractVersesForChapter, type WikiVerse } from "./parseWiki";
import { cleanMeijiVerseText } from "./parseMeiji";

/**
 * Index: {@link https://ja.wikisource.org/wiki/明治元訳旧約聖書_(ルビ付) 明治元訳旧約聖書 (ルビ付)} —
 * first two entries are split Genesis with furigana.
 */
export const MEIJI_OT_GENESIS_RUBY_PAGE_1 = "創世記1 (文語訳ルビ付)";
export const MEIJI_OT_GENESIS_RUBY_PAGE_2 = "創世記2 (文語訳ルビ付)";

/**
 * Index: {@link https://ja.wikisource.org/wiki/明治元訳旧約聖書 明治元訳旧約聖書} — standalone subpages
 * e.g. `創世記(文語訳)`, `出エジプト記(文語訳)` (not `明治元訳旧約聖書/…`, which has no such pages).
 */
export const MEIJI_OT_GENESIS_FULL = "創世記(文語訳)";

/** Genesis 創世記1+2 (ルビ付) cover through chapter 25 per Wikisource section notes; 26+ use full book. */
export const MEIJI_OT_GENESIS_RUBY_THROUGH_CHAPTER = 25;

/**
 * Load Meiji OT wikitext for book 1 (Genesis): ルビ付 parts 1–2 for early chapters, else full `創世記(文語訳)`.
 * Other books: caller passes the usual `…(文語訳)` title.
 */
export async function fetchMeijiGenesisWikitext(
  chapter: number,
  signal: AbortSignal,
): Promise<{ wikitext: string; title: string }> {
  if (chapter > MEIJI_OT_GENESIS_RUBY_THROUGH_CHAPTER) {
    return fetchJaWikisourceWikitext(MEIJI_OT_GENESIS_FULL, signal);
  }
  const [r1, r2] = await Promise.all([
    fetchJaWikisourceWikitext(MEIJI_OT_GENESIS_RUBY_PAGE_1, signal),
    fetchJaWikisourceWikitext(MEIJI_OT_GENESIS_RUBY_PAGE_2, signal),
  ]);
  const wikitext = `${r1.wikitext}\n${r2.wikitext}`;
  const title = `${r1.title} · ${r2.title}`;
  return { wikitext, title };
}

/** If Genesis ruby merge yields no verses, fall back to the single-volume page. */
export async function extractMeijiGenesisChapter(
  chapter: number,
  signal: AbortSignal,
): Promise<{ verses: WikiVerse[]; title: string }> {
  let { wikitext, title } = await fetchMeijiGenesisWikitext(chapter, signal);
  let verses = extractVersesForChapter(wikitext, chapter, cleanMeijiVerseText);
  if (verses.length > 0) return { verses, title };

  const full = await fetchJaWikisourceWikitext(MEIJI_OT_GENESIS_FULL, signal);
  verses = extractVersesForChapter(full.wikitext, chapter, cleanMeijiVerseText);
  return { verses, title: full.title };
}

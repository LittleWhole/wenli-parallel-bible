import { DU_CLOSE, DU_OPEN, UL_CLOSE, UL_OPEN } from "./parseWiki";

/** PUA markers for {{ruby|base|rt}} after cleaning (walked by MeijiVerseBody). */
export const RUBY_OPEN = "\uE020";
export const RUBY_MID = "\uE021";
export const RUBY_END = "\uE022";

/**
 * Clean Japanese-column verse text: furigana; Taisho 4-style 專名/地名 from HTML;
 * drop most other wiki markup. (Same sentinels as 文理和合 {{ul|…}}/{{du|…}} for CSS underlines.)
 */
export function cleanMeijiVerseText(raw: string): string {
  let t = raw;
  t = t.replace(/<br\s*\/?>/gi, "");
  // Taisho 4: double rule = 地名 (place) — before stripping tags
  t = t.replace(
    /<span[^>]*style\s*=\s*["'][^"']*border-bottom:\s*double[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
    `${DU_OPEN}$1${DU_CLOSE}`,
  );
  // Taisho 4: single underline = 專名 (proper name)
  t = t.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, `${UL_OPEN}$1${UL_CLOSE}`);
  // {{ruby|漢字|よみ}} — before generic tag strip
  for (let k = 0; k < 20; k++) {
    const next = t.replace(/\{\{ruby\|([^|{}]+)\|([^}]+)\}\}/, `${RUBY_OPEN}$1${RUBY_MID}$2${RUBY_END}`);
    if (next === t) break;
    t = next;
  }
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");
  t = t.replace(/\[\[([^\]]+)\]\]/g, "$1");
  t = t.replace(/\{\{[^|{}]+\|([^|{}]+)\}\}/g, "$1");
  t = t.replace(/\{\{[^|{}]+\|([^|{}]+)\}\}/g, "$1");
  t = t.replace(/\{\{[^}]*\}\}/g, "");
  t = t.replace(/[ \t\u3000]+/g, " ").trim();
  return t;
}

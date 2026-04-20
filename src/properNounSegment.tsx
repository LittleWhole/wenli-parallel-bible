import { Fragment, type ReactNode } from "react";
import nounsRaw from "./data/biblical-proper-nouns.txt?raw";
import { buildProperNounTrie } from "./properNounTrie";

const PROPER_NOUNS = Array.from(
  new Set(
    nounsRaw
      .split(/\r?\n/)
      .map((line) => line.replace(/#.*$/, "").trim())
      .filter(Boolean),
  ),
);

const findLongestProperNoun = buildProperNounTrie(PROPER_NOUNS);

export type ProperSeg = { k: "t"; v: string } | { k: "n"; v: string };

const SEG_CACHE = new Map<string, ProperSeg[]>();
const SEG_CACHE_CAP = 5000;

function segmentToSegs(text: string): ProperSeg[] {
  const hit = SEG_CACHE.get(text);
  if (hit) {
    SEG_CACHE.delete(text);
    SEG_CACHE.set(text, hit);
    return hit;
  }

  const segs: ProperSeg[] = [];
  let i = 0;
  while (i < text.length) {
    const m = findLongestProperNoun(text, i);
    if (m) {
      segs.push({ k: "n", v: m });
      i += m.length;
      continue;
    }
    const ch = text[i];
    const last = segs[segs.length - 1];
    if (last?.k === "t") last.v += ch;
    else segs.push({ k: "t", v: ch });
    i += 1;
  }

  if (SEG_CACHE.size >= SEG_CACHE_CAP) {
    SEG_CACHE.delete(SEG_CACHE.keys().next().value as string);
  }
  SEG_CACHE.set(text, segs);
  return segs;
}

const BOOK_NAME_RE = /《([^》]*)》/g;

/**
 * Renders verse body with:
 *  - 書名線 (wavy overline) on book/literary titles marked with 《...》 — brackets stripped
 *  - 專名線 (solid right-side line) on proper nouns via longest-match dictionary
 */
export function renderZhWithProperNouns(text: string, verseKey: string): ReactNode {
  // Split on 《...》 first so book titles get their own spans; apply proper noun
  // detection only on the plain-text chunks in between.
  type Chunk = { kind: "book"; v: string } | { kind: "text"; v: string };
  const chunks: Chunk[] = [];
  let last = 0;
  BOOK_NAME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = BOOK_NAME_RE.exec(text)) !== null) {
    if (m.index > last) chunks.push({ kind: "text", v: text.slice(last, m.index) });
    chunks.push({ kind: "book", v: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) chunks.push({ kind: "text", v: text.slice(last) });

  const parts: ReactNode[] = [];
  let pn = 0;
  let bn = 0;

  for (const chunk of chunks) {
    if (chunk.kind === "book") {
      parts.push(
        <span className="book-name" key={`${verseKey}-bn-${bn++}`} translate="no">
          {chunk.v}
        </span>,
      );
    } else {
      for (const s of segmentToSegs(chunk.v)) {
        if (s.k === "t") {
          if (s.v) parts.push(s.v);
        } else {
          parts.push(
            <span className="proper-noun" key={`${verseKey}-pn-${pn++}`} translate="no">
              {s.v}
            </span>,
          );
        }
      }
    }
  }

  if (parts.length === 0) return null;
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return <Fragment>{parts}</Fragment>;
}

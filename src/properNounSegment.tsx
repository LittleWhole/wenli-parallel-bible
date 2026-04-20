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

// Split text into speech/non-speech segments using 曰 (speaker attribution) and ○ (paragraph break).
// Text immediately after 曰 is speech (red); ○ resets back to non-speech.
// startsInSpeech carries state from the previous verse for continuous multi-verse speeches.
type YueSeg = { text: string; red: boolean };
function splitByYue(text: string, startsInSpeech = false): { segs: YueSeg[]; endsInSpeech: boolean } {
  const segs: YueSeg[] = [];
  let inSpeech = startsInSpeech;
  let segStart = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "曰") {
      if (i > segStart) segs.push({ text: text.slice(segStart, i), red: inSpeech });
      segs.push({ text: "曰", red: false });
      segStart = i + 1;
      inSpeech = true;
    } else if (ch === "○") {
      if (i > segStart) segs.push({ text: text.slice(segStart, i), red: inSpeech });
      segs.push({ text: "○", red: false });
      segStart = i + 1;
      inSpeech = false;
    }
  }
  if (segStart < text.length) segs.push({ text: text.slice(segStart), red: inSpeech });
  return { segs, endsInSpeech: inSpeech };
}

/**
 * Renders verse body with:
 *  - 書名線 (wavy underline) on book/literary titles marked with 《...》 — brackets stripped
 *  - 專名線 (solid underline) on proper nouns via longest-match dictionary
 *  - words-of-jesus coloring on speech segments after 曰 / before 曰 or ○ (when isRedLetterVerse)
 */
export function renderZhWithProperNouns(
  text: string,
  verseKey: string,
  isRedLetterVerse = false,
  startsInSpeech = false,
): ReactNode {
  let keyIdx = 0;
  const k = () => `${verseKey}-${keyIdx++}`;

  // Render a plain-text chunk applying book-name and proper-noun spans.
  function renderChunkNodes(chunk: string): ReactNode[] {
    const result: ReactNode[] = [];
    BOOK_NAME_RE.lastIndex = 0;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = BOOK_NAME_RE.exec(chunk)) !== null) {
      if (m.index > last) {
        for (const s of segmentToSegs(chunk.slice(last, m.index))) {
          if (s.k === "t") { if (s.v) result.push(s.v); }
          else result.push(<span className="proper-noun" key={k()} translate="no">{s.v}</span>);
        }
      }
      result.push(<span className="book-name" key={k()} translate="no">{m[1]}</span>);
      last = m.index + m[0].length;
    }
    if (last < chunk.length) {
      for (const s of segmentToSegs(chunk.slice(last))) {
        if (s.k === "t") { if (s.v) result.push(s.v); }
        else result.push(<span className="proper-noun" key={k()} translate="no">{s.v}</span>);
      }
    }
    return result;
  }

  const parts: ReactNode[] = [];

  if (isRedLetterVerse) {
    const { segs: yueSegs } = splitByYue(text, startsInSpeech);
    if (yueSegs.some((s) => s.red)) {
      for (const ySeg of yueSegs) {
        const nodes = renderChunkNodes(ySeg.text);
        if (ySeg.red) {
          parts.push(<span className="words-of-jesus" key={k()}>{nodes}</span>);
        } else {
          for (const n of nodes) parts.push(n);
        }
      }
    } else {
      // No 曰 found in this verse — no speech markup possible
      for (const n of renderChunkNodes(text)) parts.push(n);
    }
  } else {
    for (const n of renderChunkNodes(text)) parts.push(n);
  }

  if (parts.length === 0) return null;
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return <Fragment>{parts}</Fragment>;
}

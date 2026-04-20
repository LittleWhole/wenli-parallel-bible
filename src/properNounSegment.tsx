/**
 * Renders Chinese verse text with three levels of annotation:
 *
 *  1. 書名線 (zigzag underline) — book/literary titles detected by trie.
 *     These take HIGHEST priority and override sentinel marks in the same span.
 *     e.g. "先知{{ul|以賽亞}}書" → the trie matches "以賽亞書" as a book name even
 *     though "以賽亞" was sentinel-marked as a proper noun.
 *
 *  2. 專名線 (solid underline) — proper nouns marked {{ul|…}} by Wikisource.
 *     Sentinel chars \uE001…\uE002 embedded by cleanWikiVerseText().
 *
 *  3. 地名線 (double underline) — place names marked {{du|…}} by Wikisource.
 *     Sentinel chars \uE003…\uE004 embedded by cleanWikiVerseText().
 *
 * The trie data files (biblical-proper-nouns.txt / biblical-place-names.txt)
 * are kept for reference but are not used in active rendering.
 */
import { Fragment, type ReactNode } from "react";
import bookNamesRaw from "./data/biblical-book-names.txt?raw";
import { buildProperNounTrie } from "./properNounTrie";
import { UL_OPEN, UL_CLOSE, DU_OPEN, DU_CLOSE } from "./parseWiki";

// ── Book-name trie ────────────────────────────────────────────────────────────

function loadLines(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/\r?\n/)
        .map((line) => line.replace(/#.*$/, "").trim())
        .filter(Boolean),
    ),
  );
}

const findBookName = buildProperNounTrie(loadLines(bookNamesRaw));

// ── Speech segmentation (曰 / ○) ─────────────────────────────────────────────

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

// ── Core annotated-text renderer ──────────────────────────────────────────────

const SENTINEL_RE = /[\uE001\uE002\uE003\uE004]/g;

/**
 * Renders a chunk of sentinel-annotated text into React nodes.
 *
 * Algorithm:
 *  1. Build a "clean" string (sentinels stripped) and a sentinel→clean index map.
 *  2. Run the book-name trie on the clean string; record (cleanStart, cleanEnd) spans.
 *  3. Walk the sentinel string character by character:
 *     a. If a book-name span starts at the current clean position → consume the
 *        corresponding sentinel range and emit a <span.book-name>.
 *     b. Else if char is UL_OPEN  → consume up to matching UL_CLOSE → <span.proper-noun>.
 *     c. Else if char is DU_OPEN  → consume up to matching DU_CLOSE → <span.place-name>.
 *     d. Else → accumulate plain text.
 */
function renderAnnotatedChunk(text: string, keyFn: () => string): ReactNode[] {
  // ── Step 1: position map ─────────────────────────────────────────────────
  const cleanChars: string[] = [];
  const sentToClean = new Int32Array(text.length + 1);
  for (let i = 0; i < text.length; i++) {
    sentToClean[i] = cleanChars.length;
    const ch = text[i];
    if (ch !== UL_OPEN && ch !== UL_CLOSE && ch !== DU_OPEN && ch !== DU_CLOSE) {
      cleanChars.push(ch);
    }
  }
  sentToClean[text.length] = cleanChars.length;
  const clean = cleanChars.join("");

  // ── Step 2: book-name spans on clean text ────────────────────────────────
  // Map cleanStart → { cleanEnd, name }
  const bookAt = new Map<number, { end: number; name: string }>();
  for (let j = 0; j < clean.length; ) {
    const bm = findBookName(clean, j);
    if (bm) {
      bookAt.set(j, { end: j + bm.length, name: bm });
      j += bm.length;
    } else {
      j++;
    }
  }

  // ── Step 3: walk sentinel text ───────────────────────────────────────────
  const result: ReactNode[] = [];
  let plainBuf = "";
  const flushPlain = () => {
    if (plainBuf) { result.push(plainBuf); plainBuf = ""; }
  };

  let i = 0;
  while (i < text.length) {
    const cleanPos = sentToClean[i];
    const ch = text[i];

    // (a) Book name — highest priority; override any sentinel marks in the span.
    const span = bookAt.get(cleanPos);
    if (span && ch !== UL_CLOSE && ch !== DU_CLOSE) {
      // Advance past all sentinel chars whose clean position is within the span.
      let j = i;
      while (j < text.length && sentToClean[j] < span.end) j++;
      flushPlain();
      result.push(<span className="book-name" key={keyFn()} translate="no">{span.name}</span>);
      i = j;
      continue;
    }

    // (b) Proper noun {{ul|…}}.
    if (ch === UL_OPEN) {
      const close = text.indexOf(UL_CLOSE, i + 1);
      if (close !== -1) {
        const name = text.slice(i + 1, close).replace(SENTINEL_RE, "");
        flushPlain();
        result.push(<span className="proper-noun" key={keyFn()} translate="no">{name}</span>);
        i = close + 1;
        continue;
      }
    }

    // (c) Place name {{du|…}}.
    if (ch === DU_OPEN) {
      const close = text.indexOf(DU_CLOSE, i + 1);
      if (close !== -1) {
        const name = text.slice(i + 1, close).replace(SENTINEL_RE, "");
        flushPlain();
        result.push(<span className="place-name" key={keyFn()} translate="no">{name}</span>);
        i = close + 1;
        continue;
      }
    }

    // (d) Stray sentinel (e.g. a UL_CLOSE whose UL_OPEN was consumed by a book name) — skip.
    if (ch === UL_CLOSE || ch === DU_CLOSE) { i++; continue; }

    // (e) Plain text.
    plainBuf += ch;
    i++;
  }
  flushPlain();
  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Renders verse body with 書名線 / 專名線 / 地名線 and optional words-of-Jesus colouring.
 */
export function renderZhWithProperNouns(
  text: string,
  verseKey: string,
  isRedLetterVerse = false,
  startsInSpeech = false,
): ReactNode {
  let keyIdx = 0;
  const k = () => `${verseKey}-${keyIdx++}`;

  const parts: ReactNode[] = [];

  if (isRedLetterVerse) {
    const { segs: yueSegs } = splitByYue(text, startsInSpeech);
    if (yueSegs.some((s) => s.red)) {
      for (const ySeg of yueSegs) {
        const nodes = renderAnnotatedChunk(ySeg.text, k);
        if (ySeg.red) {
          parts.push(<span className="words-of-jesus" key={k()}>{nodes}</span>);
        } else {
          for (const n of nodes) parts.push(n);
        }
      }
    } else {
      for (const n of renderAnnotatedChunk(text, k)) parts.push(n);
    }
  } else {
    for (const n of renderAnnotatedChunk(text, k)) parts.push(n);
  }

  if (parts.length === 0) return null;
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return <Fragment>{parts}</Fragment>;
}

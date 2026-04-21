import { RUBY_END, RUBY_MID, RUBY_OPEN } from "./parseMeiji";
import { DU_CLOSE, DU_OPEN, UL_CLOSE, UL_OPEN } from "./parseWiki";

/**
 * If a substring [start, end) cuts through the middle of a ruby / ul / du span in `orig`, expand
 * to whole spans so we never emit `…誠\uE021まこと…` without the leading `\uE020` (U+E021 would show as □).
 */
function expandAnnotationSpans(orig: string, start: number, end: number): [number, number] {
  let s = start;
  let e = end;
  for (let iter = 0; iter < 12; iter++) {
    let ns = s;
    let ne = e;
    let pos = 0;
    while (pos < orig.length) {
      const o = orig.indexOf(RUBY_OPEN, pos);
      if (o < 0) break;
      const m = orig.indexOf(RUBY_MID, o + 1);
      const rEnd = orig.indexOf(RUBY_END, m + 1);
      if (m < 0 || rEnd < 0) {
        pos = o + 1;
        continue;
      }
      const spanEnd = rEnd + 1;
      if (ne > o && ns < spanEnd) {
        ns = Math.min(ns, o);
        ne = Math.max(ne, spanEnd);
      }
      pos = spanEnd;
    }
    pos = 0;
    while (pos < orig.length) {
      const o = orig.indexOf(UL_OPEN, pos);
      if (o < 0) break;
      const c = orig.indexOf(UL_CLOSE, o + 1);
      if (c < 0) {
        pos = o + 1;
        continue;
      }
      const spanEnd = c + 1;
      if (ne > o && ns < spanEnd) {
        ns = Math.min(ns, o);
        ne = Math.max(ne, spanEnd);
      }
      pos = spanEnd;
    }
    pos = 0;
    while (pos < orig.length) {
      const o = orig.indexOf(DU_OPEN, pos);
      if (o < 0) break;
      const c = orig.indexOf(DU_CLOSE, o + 1);
      if (c < 0) {
        pos = o + 1;
        continue;
      }
      const spanEnd = c + 1;
      if (ne > o && ns < spanEnd) {
        ns = Math.min(ns, o);
        ne = Math.max(ne, spanEnd);
      }
      pos = spanEnd;
    }
    if (ns === s && ne === e) break;
    s = ns;
    e = ne;
  }
  return [s, e];
}

type VisUnit = { ch: string; o0: number; o1: number };

/**
 * Linearize Meiji verse text for pattern matching: ruby base text, UL/DU inner text,
 * in order; drop furigana (rt) and markup sentinels.
 */
function buildMeijiVisibleUnits(text: string): VisUnit[] {
  const out: VisUnit[] = [];

  function walk(s: string, base: number) {
    let i = 0;
    while (i < s.length) {
      const c0 = s[i];
      if (c0 === RUBY_OPEN) {
        const m = s.indexOf(RUBY_MID, i + 1);
        const e = s.indexOf(RUBY_END, m + 1);
        if (m < 0 || e < 0) {
          i++;
          continue;
        }
        const baseStr = s.slice(i + 1, m);
        let off = 0;
        while (off < baseStr.length) {
          const cp = baseStr.codePointAt(off)!;
          const w = cp > 0xffff ? 2 : 1;
          const ch = String.fromCodePoint(cp);
          const g0 = base + i + 1 + off;
          out.push({ ch, o0: g0, o1: g0 + w });
          off += w;
        }
        i = e + 1;
        continue;
      }
      if (c0 === UL_OPEN || c0 === DU_OPEN) {
        const cl = c0 === UL_OPEN ? UL_CLOSE : DU_CLOSE;
        const j = s.indexOf(cl, i + 1);
        if (j < 0) {
          i++;
          continue;
        }
        walk(s.slice(i + 1, j), base + i + 1);
        i = j + 1;
        continue;
      }
      if (c0 === UL_CLOSE || c0 === DU_CLOSE) {
        i++;
        continue;
      }
      const cp = s.codePointAt(i)!;
      const w = cp > 0xffff ? 2 : 1;
      const ch = String.fromCodePoint(cp);
      const g0 = base + i;
      out.push({ ch, o0: g0, o1: g0 + w });
      i += w;
    }
  }

  walk(text, 0);
  return out;
}

/** Longest match wins — descending code-point length. */
const JA_JESUS_OPEN_PATTERNS = [
  "イエス答て曰けるは、",
  "イエス答て曰けるは",
  "イエス答へて曰けるは、",
  "イエス答へて曰けるは",
  "イエス答けるは、",
  "イエス答けるは",
  "イエス答て、",
  "イエス答て",
  "イエス答へて、",
  "イエス答へて",
  "イエス曰く、",
  "イエス曰く",
  "イエス語りて曰く、",
  "イエス語りて曰く",
].sort((a, b) => [...b].length - [...a].length);

const JA_SPEECH_CLOSE = new Set(["」", "』", "○"]);

function matchOpenAt(units: VisUnit[], f: number): string | null {
  for (const p of JA_JESUS_OPEN_PATTERNS) {
    const pcs = [...p];
    if (f + pcs.length > units.length) continue;
    let ok = true;
    for (let k = 0; k < pcs.length; k++) {
      if (units[f + k]!.ch !== pcs[k]) {
        ok = false;
        break;
      }
    }
    if (ok) return p;
  }
  return null;
}

function sliceOrig(units: VisUnit[], orig: string, u0: number, u1: number): string {
  if (u0 >= u1) return "";
  let start = units[u0]!.o0;
  let end = units[u1 - 1]!.o1;
  [start, end] = expandAnnotationSpans(orig, start, end);
  return orig.slice(start, end);
}

export type JaSpeechSeg = { text: string; red: boolean };

export function jaVerseHasJesusSpeech(text: string, startsInSpeech = false): boolean {
  return splitByJapaneseJesus(text, startsInSpeech).segs.some((s) => s.red);
}

/**
 * After Wikisource-style discourse markers (イエス答へて、…), text is treated as Jesus’ words (red)
 * until a closing 「」/』 or ○. Same role as 曰 / ○ in the Chinese column.
 */
export function splitByJapaneseJesus(
  orig: string,
  startsInSpeech: boolean,
): { segs: JaSpeechSeg[]; endsInSpeech: boolean } {
  const units = buildMeijiVisibleUnits(orig);
  const segs: JaSpeechSeg[] = [];
  let inSpeech = startsInSpeech;
  let f = 0;
  let segUnitStart = 0;

  const pushSeg = (u0: number, u1: number, red: boolean) => {
    if (u0 >= u1) return;
    segs.push({ text: sliceOrig(units, orig, u0, u1), red });
  };

  while (f < units.length) {
    if (inSpeech && JA_SPEECH_CLOSE.has(units[f]!.ch)) {
      pushSeg(segUnitStart, f, true);
      segs.push({ text: orig.slice(units[f]!.o0, units[f]!.o1), red: false });
      segUnitStart = f + 1;
      f++;
      inSpeech = false;
      continue;
    }

    const openP = matchOpenAt(units, f);
    if (openP) {
      const plen = [...openP].length;
      pushSeg(segUnitStart, f, inSpeech);
      pushSeg(f, f + plen, false);
      segUnitStart = f + plen;
      f = segUnitStart;
      inSpeech = true;
      continue;
    }

    f++;
  }

  pushSeg(segUnitStart, units.length, inSpeech);

  return { segs, endsInSpeech: inSpeech };
}

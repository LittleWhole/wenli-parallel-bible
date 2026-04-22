/**
 * Map ASCII “Western” punctuation to conventional fullwidth / CJK forms for
 * 國漢文 (and similar mixed hanja) display.
 */
const ASCII_TO_CJK: Record<string, string> = {
  ",": "\uFF0C", // ，
  ".": "\u3002", // 。
  ":": "\uFF1A", // ：
  ";": "\uFF1B", // ；
  "?": "\uFF1F", // ？
  "!": "\uFF01", // ！
  "(": "\uFF08", // （
  ")": "\uFF09", // ）
  "[": "\uFF3B", // ［
  "]": "\uFF3D", // ］
  "{": "\uFF5B", // ｛
  "}": "\uFF5D", // ｝
  "-": "\uFF0D", // －
};

/** Private-use placeholders so digit–punct–digit (e.g. decimals) survives mapping. */
const PH_DOT = "\uE010";
const PH_COM = "\uE011";

function protectNumericPunctuation(s: string): string {
  return s
    .replace(/(\d)\.(\d)/g, `$1${PH_DOT}$2`)
    .replace(/(\d),(\d)/g, `$1${PH_COM}$2`);
}

function restoreNumericPunctuation(s: string): string {
  return s.replaceAll(PH_DOT, ".").replaceAll(PH_COM, ",");
}

/** Carried across verses so a `'` can close a 「…」 opened with `` ` `` in a previous verse. */
export type MichaelHanQuoteState = {
  backtickDepth: number;
  /** When `backtickDepth === 0`: if true, next orphan `'` → 「; if false → 」 (mid–speech pair). */
  orphanApostropheOpen: boolean;
};

export function initialMichaelHanQuoteState(): MichaelHanQuoteState {
  return { backtickDepth: 0, orphanApostropheOpen: true };
}

/**
 * Han Wiki uses ASCII **backtick** `` ` `` as the opening quote; **apostrophe** `'` closes it (`…' → 「…」`).
 * Standalone `'` pairs (no backtick) still alternate 「/」. Latin contractions like *don't* keep ASCII `'`.
 */
function backtickOpenApostropheClose(s: string, state: MichaelHanQuoteState): { text: string; state: MichaelHanQuoteState } {
  let { backtickDepth, orphanApostropheOpen } = state;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (ch === "`") {
      out += "「";
      backtickDepth++;
      continue;
    }
    if (ch === "'") {
      const prev = i > 0 ? s[i - 1]! : "";
      const next = i + 1 < s.length ? s[i + 1]! : "";
      if (/[a-zA-Z]/.test(prev) && /[a-zA-Z]/.test(next)) {
        out += "'";
        continue;
      }
      if (backtickDepth > 0) {
        out += "」";
        backtickDepth--;
        continue;
      }
      out += orphanApostropheOpen ? "「" : "」";
      orphanApostropheOpen = !orphanApostropheOpen;
      continue;
    }
    out += ch;
  }
  return { text: out, state: { backtickDepth, orphanApostropheOpen } };
}

/** Straight ASCII `"` … `"` → alternating 「 … 」 */
function asciiDoubleQuotesToCorner(s: string): string {
  let open = true;
  return s.replace(/"/g, () => {
    const ch = open ? "「" : "」";
    open = !open;
    return ch;
  });
}

/** Three ASCII periods → ellipsis (after `.` → `。` would break this, so run first). */
function asciiEllipsis(s: string): string {
  return s.replace(/\.{3}/g, "\u2026");
}

/**
 * @param quoteState When extracting a whole chapter verse-by-verse, pass the returned state from the
 *     previous verse so a closing `'` is not mistaken for an orphan opener 「.
 */
export function westernPunctuationToCjk(
  text: string,
  quoteState?: MichaelHanQuoteState,
): { text: string; quoteState: MichaelHanQuoteState } {
  let s = asciiEllipsis(text);
  s = protectNumericPunctuation(s);
  const q0 = quoteState ?? initialMichaelHanQuoteState();
  const { text: afterQuotes, state: q1 } = backtickOpenApostropheClose(s, q0);
  s = afterQuotes;
  s = asciiDoubleQuotesToCorner(s);
  let out = "";
  for (const ch of s) {
    out += ASCII_TO_CJK[ch] ?? ch;
  }
  return { text: restoreNumericPunctuation(out), quoteState: q1 };
}

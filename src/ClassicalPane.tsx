import { useMemo, type RefObject } from "react";
import type { WikiVerse } from "./parseWiki";
import { zhVerseHasYueRedSpeech } from "./properNounSegment";
import { ZhVerseBody } from "./ZhVerseBody";
import { MeijiVerseBody } from "./MeijiVerseBody";
import type { ZhSource } from "./zhSource";

type Props = {
  horizontalRef: RefObject<HTMLDivElement | null>;
  verses: WikiVerse[];
  refLine: string;
  status: string;
  hoveredVerse: number | null;
  onVerseHover: (verse: number | null) => void;
  redLetterVerses: Set<number>;
  /** English verse is 100% red-letter; enables full-verse 文言 red when 曰/○ do not open speech. */
  englishFullyRedVerses: Set<number>;
  zhSource: ZhSource;
};

/** DOM order reversed so `flex-direction: row` still puts verse 1 on the right (traditional column order). */
function displayVerses(verses: WikiVerse[]) {
  return verses.length ? [...verses].reverse() : [];
}

export function ClassicalPane({
  horizontalRef,
  verses,
  refLine,
  status,
  hoveredVerse,
  onVerseHover,
  redLetterVerses,
  englishFullyRedVerses,
  zhSource,
}: Props) {
  const cols = displayVerses(verses);

  // Pre-compute per-verse speech start state (carries 曰/○ state across consecutive red-letter verses).
  // When English is 100% red-letter but 曰/○ never produce red text here, we force full-verse red and do
  // not carry 曰/○ state onward (next verse is black unless it has its own red). If 曰/○ do produce red,
  // carry behaves as usual. (Meiji Japanese text does not use this path.)
  const speechStateMap = useMemo(() => {
    const map = new Map<number, boolean>();
    if (zhSource === "meiji") return map;
    let inSpeech = false;
    for (const v of verses) {
      const verseNum = parseInt(String(v.verse), 10);
      if (!redLetterVerses.has(verseNum)) {
        inSpeech = false;
        map.set(verseNum, false);
        continue;
      }
      map.set(verseNum, inSpeech);
      const blockCarry =
        englishFullyRedVerses.has(verseNum) && !zhVerseHasYueRedSpeech(v.text, inSpeech);
      if (blockCarry) {
        inSpeech = false;
        continue;
      }
      for (const ch of v.text) {
        if (ch === "曰") inSpeech = true;
        else if (ch === "○") inSpeech = false;
      }
    }
    return map;
  }, [verses, redLetterVerses, englishFullyRedVerses, zhSource]);

  const paneTitle = zhSource === "meiji" ? "明治元譯（文語）" : "文理和合譯本";
  const paneScrollLabel = zhSource === "meiji" ? "Japanese classical Bible scroll area" : "Classical Chinese scroll area";
  const paneTextLabel = zhSource === "meiji" ? "Meiji Bible text with furigana" : "Classical Chinese text";

  return (
    <section className="pane classical-pane" aria-labelledby="zh-title">
      <div className="pane-head">
        <h2 id="zh-title">{paneTitle}</h2>
        <div className="ref-line" aria-live="polite">
          {refLine}
        </div>
      </div>
      <div className="pane-scroll-zh" role="region" aria-label={paneScrollLabel}>
        <div
          ref={horizontalRef}
          className="vertical-verses"
          aria-label={paneTextLabel}
        >
          {cols.map((v) => {
            const verseNum = parseInt(String(v.verse), 10);
            return (
              <div
                key={v.verse}
                className={`verse-col${zhSource === "meiji" ? " verse-col--ja" : ""}${hoveredVerse === verseNum ? " is-hovered" : ""}`}
                onMouseEnter={() => onVerseHover(verseNum)}
                onMouseLeave={() => onVerseHover(null)}
              >
                <span className="verse-num">{v.verse}</span>
                {zhSource === "meiji" ? (
                  <MeijiVerseBody
                    text={v.text}
                    verseKey={String(v.verse)}
                    wrapWordsOfJesus={
                      redLetterVerses.has(verseNum) && englishFullyRedVerses.has(verseNum)
                    }
                  />
                ) : (
                  <ZhVerseBody
                    text={v.text}
                    verseKey={String(v.verse)}
                    isRedLetterVerse={redLetterVerses.has(verseNum)}
                    startsInSpeech={speechStateMap.get(verseNum) ?? false}
                    forceFullVerseRed={englishFullyRedVerses.has(verseNum)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="status" role="status">
        {status}
      </div>
    </section>
  );
}

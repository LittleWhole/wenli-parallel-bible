import { useMemo, type RefObject } from "react";
import type { WikiVerse } from "./parseWiki";
import { jaVerseHasJesusSpeech, splitByJapaneseJesus } from "./jaJesusSpeech";
import {
  cornerQuoteEndsInSpeech,
  zhVerseHasCornerQuoteRedSpeech,
  zhVerseHasYueRedSpeech,
} from "./properNounSegment";
import { ZhVerseBody } from "./ZhVerseBody";
import { MeijiVerseBody } from "./MeijiVerseBody";
import { classicalPaneHeading, meijiIsNewTestament, type ZhSource } from "./zhSource";

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
  /** Used to show 舊約 vs 新約 Meiji Wikisource when zhSource is meiji. */
  bookId: number;
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
  bookId,
}: Props) {
  const cols = displayVerses(verses);

  // Pre-compute per-verse speech start state (曰/○ for 文理; 「…」 for 國漢文; イエス…/「」 for 明治).
  // When English is 100% red-letter but no discourse red segments appear, we force full-verse red and do
  // not carry speech state onward. If discourse rules do produce red, carry behaves as usual.
  const speechStateMap = useMemo(() => {
    const map = new Map<number, boolean>();
    let inSpeech = false;
    for (const v of verses) {
      const verseNum = parseInt(String(v.verse), 10);
      if (!redLetterVerses.has(verseNum)) {
        map.set(verseNum, false);
        // 國漢文: advance 「…」 depth through narrative verses so a closing 」 in a
        // non–red-letter verse updates carry (resetting blindly mis-highlights later verses).
        if (zhSource === "koreanHan") {
          inSpeech = cornerQuoteEndsInSpeech(v.text, inSpeech);
        } else {
          inSpeech = false;
        }
        continue;
      }
      map.set(verseNum, inSpeech);
      const blockCarry =
        englishFullyRedVerses.has(verseNum) &&
        (zhSource === "meiji"
          ? !jaVerseHasJesusSpeech(v.text, inSpeech)
          : zhSource === "koreanHan"
            ? !zhVerseHasCornerQuoteRedSpeech(v.text, inSpeech)
            : !zhVerseHasYueRedSpeech(v.text, inSpeech));
      if (blockCarry) {
        inSpeech = false;
        continue;
      }
      if (zhSource === "meiji") {
        inSpeech = splitByJapaneseJesus(v.text, inSpeech).endsInSpeech;
      } else if (zhSource === "koreanHan") {
        inSpeech = cornerQuoteEndsInSpeech(v.text, inSpeech);
      } else {
        for (const ch of v.text) {
          if (ch === "曰") inSpeech = true;
          else if (ch === "○") inSpeech = false;
        }
      }
    }
    return map;
  }, [verses, redLetterVerses, englishFullyRedVerses, zhSource]);

  const paneTitle = classicalPaneHeading(zhSource, bookId);
  const paneScrollLabel =
      zhSource === "meiji"
      ? meijiIsNewTestament(bookId)
        ? "Japanese column scroll area (New Testament)"
        : "Japanese column scroll area (Old Testament)"
      : zhSource === "koreanHan"
        ? "CJK column scroll area"
        : "Classical Chinese scroll area";
  const paneTextLabel =
    zhSource === "meiji"
      ? meijiIsNewTestament(bookId)
        ? "Japanese New Testament text with furigana"
        : "Japanese Old Testament text with furigana"
      : zhSource === "koreanHan"
        ? "CJK column text"
        : "Classical Chinese text";

  return (
    <section
      className="pane classical-pane"
      lang={zhSource === "meiji" ? "ja" : "zh-Hant"}
      aria-labelledby="zh-title"
    >
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
                    isRedLetterVerse={redLetterVerses.has(verseNum)}
                    startsInSpeech={speechStateMap.get(verseNum) ?? false}
                    forceFullVerseRed={englishFullyRedVerses.has(verseNum)}
                  />
                ) : (
                  <ZhVerseBody
                    text={v.text}
                    verseKey={String(v.verse)}
                    isRedLetterVerse={redLetterVerses.has(verseNum)}
                    startsInSpeech={speechStateMap.get(verseNum) ?? false}
                    forceFullVerseRed={englishFullyRedVerses.has(verseNum)}
                    redSpeechMode={zhSource === "koreanHan" ? "corner" : "yue"}
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

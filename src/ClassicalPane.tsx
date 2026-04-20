import { useMemo, type RefObject } from "react";
import type { WikiVerse } from "./parseWiki";
import { ZhVerseBody } from "./ZhVerseBody";

type Props = {
  horizontalRef: RefObject<HTMLDivElement | null>;
  verses: WikiVerse[];
  refLine: string;
  status: string;
  hoveredVerse: number | null;
  onVerseHover: (verse: number | null) => void;
  redLetterVerses: Set<number>;
};

/** DOM order reversed so `flex-direction: row` still puts verse 1 on the right (traditional column order). */
function displayVerses(verses: WikiVerse[]) {
  return verses.length ? [...verses].reverse() : [];
}

export function ClassicalPane({ horizontalRef, verses, refLine, status, hoveredVerse, onVerseHover, redLetterVerses }: Props) {
  const cols = displayVerses(verses);

  // Pre-compute per-verse speech start state (carries 曰/○ state across consecutive red-letter verses).
  const speechStateMap = useMemo(() => {
    const map = new Map<number, boolean>();
    let inSpeech = false;
    for (const v of verses) {
      const verseNum = parseInt(String(v.verse), 10);
      if (!redLetterVerses.has(verseNum)) {
        inSpeech = false;
        map.set(verseNum, false);
        continue;
      }
      map.set(verseNum, inSpeech);
      for (const ch of v.text) {
        if (ch === "曰") inSpeech = true;
        else if (ch === "○") inSpeech = false;
      }
    }
    return map;
  }, [verses, redLetterVerses]);

  return (
    <section className="pane classical-pane" aria-labelledby="zh-title">
      <div className="pane-head">
        <h2 id="zh-title">文理和合譯本</h2>
        <div className="ref-line" aria-live="polite">
          {refLine}
        </div>
      </div>
      <div className="pane-scroll-zh" role="region" aria-label="Classical Chinese scroll area">
        <div
          ref={horizontalRef}
          className="vertical-verses"
          aria-label="Classical Chinese text"
        >
          {cols.map((v) => {
            const verseNum = parseInt(String(v.verse), 10);
            return (
              <div
                key={v.verse}
                className={`verse-col${hoveredVerse === verseNum ? " is-hovered" : ""}`}
                onMouseEnter={() => onVerseHover(verseNum)}
                onMouseLeave={() => onVerseHover(null)}
              >
                <span className="verse-num">{v.verse}</span>
                <ZhVerseBody
                  text={v.text}
                  verseKey={String(v.verse)}
                  isRedLetterVerse={redLetterVerses.has(verseNum)}
                  startsInSpeech={speechStateMap.get(verseNum) ?? false}
                />
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

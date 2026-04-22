import { useMemo } from "react";
import { renderZhWithProperNouns, type ZhRedSpeechMode } from "./properNounSegment";

type Props = {
  text: string;
  verseKey: string;
  isRedLetterVerse?: boolean;
  startsInSpeech?: boolean;
  forceFullVerseRed?: boolean;
  /** 國漢文: use 「…」 segments for Jesus speech; 文理: 曰 / ○ */
  redSpeechMode?: ZhRedSpeechMode;
};

/** Memoized wrapper so unchanged verses skip re-segmenting when the parent re-renders. */
export function ZhVerseBody({
  text,
  verseKey,
  isRedLetterVerse = false,
  startsInSpeech = false,
  forceFullVerseRed = false,
  redSpeechMode = "yue",
}: Props) {
  return useMemo(
    () =>
      renderZhWithProperNouns(
        text,
        verseKey,
        isRedLetterVerse,
        startsInSpeech,
        forceFullVerseRed,
        redSpeechMode,
      ),
    [text, verseKey, isRedLetterVerse, startsInSpeech, forceFullVerseRed, redSpeechMode],
  );
}

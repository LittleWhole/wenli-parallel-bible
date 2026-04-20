import { useMemo } from "react";
import { renderZhWithProperNouns } from "./properNounSegment";

type Props = { text: string; verseKey: string; isRedLetterVerse?: boolean; startsInSpeech?: boolean };

/** Memoized wrapper so unchanged verses skip re-segmenting when the parent re-renders. */
export function ZhVerseBody({ text, verseKey, isRedLetterVerse = false, startsInSpeech = false }: Props) {
  return useMemo(
    () => renderZhWithProperNouns(text, verseKey, isRedLetterVerse, startsInSpeech),
    [text, verseKey, isRedLetterVerse, startsInSpeech],
  );
}

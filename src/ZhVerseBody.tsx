import { useMemo } from "react";
import { renderZhWithProperNouns } from "./properNounSegment";

type Props = { text: string; verseKey: string };

/** Memoized wrapper so unchanged verses skip re-segmenting when the parent re-renders. */
export function ZhVerseBody({ text, verseKey }: Props) {
  return useMemo(() => renderZhWithProperNouns(text, verseKey), [text, verseKey]);
}

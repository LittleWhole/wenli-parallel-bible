import { Fragment, useMemo, type ReactNode } from "react";
import { splitByJapaneseJesus } from "./jaJesusSpeech";
import { RUBY_END, RUBY_MID, RUBY_OPEN } from "./parseMeiji";
import { DU_CLOSE, DU_OPEN, UL_CLOSE, UL_OPEN } from "./parseWiki";

function wrapNodes(nodes: ReactNode[]): ReactNode {
  if (nodes.length === 0) return null;
  if (nodes.length === 1) return nodes[0] as ReactNode;
  return <Fragment>{nodes}</Fragment>;
}

/** Furigana + Taisho 4 專名/地名 (same PUA sentinels as 文理 {{ul}}/{{du}}). */
function renderMeijiInner(text: string, keyFn: () => string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let buf = "";
  const flush = () => {
    if (buf) {
      out.push(buf);
      buf = "";
    }
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === RUBY_OPEN) {
      const m = text.indexOf(RUBY_MID, i + 1);
      const e = text.indexOf(RUBY_END, m + 1);
      if (m !== -1 && e !== -1) {
        flush();
        const base = text.slice(i + 1, m);
        const rt = text.slice(m + 1, e);
        const baseNodes = renderMeijiInner(base, keyFn);
        out.push(
          <ruby key={keyFn()} className="meiji-ruby">
            {wrapNodes(baseNodes)}
            <rt className="meiji-ruby-text">{rt}</rt>
          </ruby>,
        );
        i = e + 1;
        continue;
      }
      i++;
      continue;
    }
    if (ch === UL_OPEN) {
      const close = text.indexOf(UL_CLOSE, i + 1);
      if (close !== -1) {
        flush();
        const inner = text.slice(i + 1, close);
        const innerNodes = renderMeijiInner(inner, keyFn);
        out.push(
          <span key={keyFn()} className="proper-noun" translate="no">
            {wrapNodes(innerNodes)}
          </span>,
        );
        i = close + 1;
        continue;
      }
    }
    if (ch === DU_OPEN) {
      const close = text.indexOf(DU_CLOSE, i + 1);
      if (close !== -1) {
        flush();
        const inner = text.slice(i + 1, close);
        const innerNodes = renderMeijiInner(inner, keyFn);
        out.push(
          <span key={keyFn()} className="place-name" translate="no">
            {wrapNodes(innerNodes)}
          </span>,
        );
        i = close + 1;
        continue;
      }
    }
    if (ch === UL_CLOSE || ch === DU_CLOSE) {
      i++;
      continue;
    }
    /* Orphan furigana sentinels (e.g. speech split mid-{{ruby}}) — U+E021 is RUBY_MID */
    if (ch === RUBY_MID || ch === RUBY_END) {
      i++;
      continue;
    }
    buf += ch;
    i += 1;
  }
  flush();
  return out;
}

type Props = {
  text: string;
  verseKey: string;
  /** Verse is red-letter in English (candidate for イエス… discourse colouring). */
  isRedLetterVerse?: boolean;
  /** Speech continues from the previous verse (closing bracket not yet seen). */
  startsInSpeech?: boolean;
  /** English is fully red; if no discourse match, colour the whole verse like 文理. */
  forceFullVerseRed?: boolean;
};

/** Furigana-capable Meiji / Taisho 4 text with 專名 / 地名 and イエス…-style red speech. */
export function MeijiVerseBody({
  text,
  verseKey,
  isRedLetterVerse = false,
  startsInSpeech = false,
  forceFullVerseRed = false,
}: Props) {
  return useMemo(() => {
    let k = 0;
    const keyFn = () => `${verseKey}-${k++}`;
    const renderInner = (t: string) => wrapNodes(renderMeijiInner(t, keyFn));

    if (!isRedLetterVerse) {
      return <span translate="no">{renderInner(text)}</span>;
    }

    const { segs } = splitByJapaneseJesus(text, startsInSpeech);
    const hasJesusSpeech = segs.some((s) => s.red);
    if (forceFullVerseRed && !hasJesusSpeech) {
      return (
        <span className="words-of-jesus" translate="no">
          {renderInner(text)}
        </span>
      );
    }
    if (!hasJesusSpeech) {
      return <span translate="no">{renderInner(text)}</span>;
    }

    const parts: ReactNode[] = [];
    for (const ySeg of segs) {
      const inner = renderInner(ySeg.text);
      if (ySeg.red) {
        parts.push(
          <span className="words-of-jesus" key={keyFn()} translate="no">
            {inner}
          </span>,
        );
      } else {
        parts.push(<Fragment key={keyFn()}>{inner}</Fragment>);
      }
    }
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    return <Fragment>{parts}</Fragment>;
  }, [text, verseKey, isRedLetterVerse, startsInSpeech, forceFullVerseRed]);
}

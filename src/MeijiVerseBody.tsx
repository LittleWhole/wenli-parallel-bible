import { Fragment, useMemo, type ReactNode } from "react";
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
    buf += ch;
    i += 1;
  }
  flush();
  return out;
}

type Props = {
  text: string;
  verseKey: string;
  /** Same red-letter overlay as 文理 (words of Jesus). */
  wrapWordsOfJesus?: boolean;
};

/** Furigana-capable Meiji / Taisho 4 text with 專名 (single rule) and 地名 (double rule). */
export function MeijiVerseBody({ text, verseKey, wrapWordsOfJesus = false }: Props) {
  return useMemo(() => {
    let k = 0;
    const keyFn = () => `${verseKey}-${k++}`;
    const nodes = renderMeijiInner(text, keyFn);
    if (nodes.length === 0) return null;
    const inner = wrapNodes(nodes);
    if (wrapWordsOfJesus) {
      return (
        <span className="words-of-jesus" translate="no">
          {inner}
        </span>
      );
    }
    return <span translate="no">{inner}</span>;
  }, [text, verseKey, wrapWordsOfJesus]);
}

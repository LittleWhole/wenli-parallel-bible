import { useMemo, useState } from "react";
import type { WsBookDef } from "./constants";

const OT_LAST_ID = 39;

export type BookRow = { def: WsBookDef; chapters?: number };

type Props = {
  rows: BookRow[];
  bookId: number;
  onBookChange: (id: number) => void;
  chapter: number;
  onChapterChange: (n: number) => void;
  chapterMax?: number;
};

export function PassagePicker({ rows, bookId, onBookChange, chapter, onChapterChange, chapterMax }: Props) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const raw = query.trim();
    if (!raw) return rows;
    const q = raw.toLowerCase();
    return rows.filter(
      ({ def }) =>
        def.en.toLowerCase().includes(q) ||
        def.ws.includes(raw) ||
        String(def.id).includes(raw),
    );
  }, [rows, query]);

  const displayRows = useMemo(() => {
    const selected = rows.find((r) => r.def.id === bookId);
    if (!selected) return filteredRows;
    if (filteredRows.some((r) => r.def.id === bookId)) return filteredRows;
    return [selected, ...filteredRows];
  }, [rows, filteredRows, bookId]);

  const { ot, nt } = useMemo(() => {
    const o = displayRows.filter((r) => r.def.id <= OT_LAST_ID);
    const n = displayRows.filter((r) => r.def.id > OT_LAST_ID);
    return { ot: o, nt: n };
  }, [displayRows]);

  const maxCh = chapterMax && chapterMax > 0 ? chapterMax : 150;
  const safeChapter = Math.min(Math.max(1, chapter), maxCh);
  const canNext = chapterMax != null && chapterMax > 0 ? chapter < chapterMax : false;

  const bookSelectTitle = `${displayRows.length} / ${rows.length} books${query.trim() ? " (filtered)" : ""}`;

  return (
    <nav className="passage-picker" aria-label="Passage">
      <div className="passage-picker-book-row">
        <label htmlFor="book-filter" className="sr-only">
          Filter book list
        </label>
        <input
          id="book-filter"
          type="search"
          className="book-filter-input"
          placeholder="Filter books…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="search"
        />
        <label htmlFor="book-select" className="sr-only">
          Book
        </label>
        <select
          id="book-select"
          className="book-select"
          value={String(bookId)}
          title={bookSelectTitle}
          onChange={(e) => onBookChange(Number(e.target.value))}
        >
          {ot.length > 0 && (
            <optgroup label="Old Testament">
              {ot.map(({ def, chapters }) => (
                <option key={def.id} value={String(def.id)}>
                  {def.en} · {def.ws}
                  {chapters ? ` (${chapters})` : ""}
                </option>
              ))}
            </optgroup>
          )}
          {nt.length > 0 && (
            <optgroup label="New Testament">
              {nt.map(({ def, chapters }) => (
                <option key={def.id} value={String(def.id)}>
                  {def.en} · {def.ws}
                  {chapters ? ` (${chapters})` : ""}
                </option>
              ))}
            </optgroup>
          )}
          {ot.length === 0 && nt.length === 0 && <option value="">No match</option>}
        </select>
      </div>

      <div className="passage-picker-chapter-row">
        <label className="picker-label-mini" htmlFor="chapter-range">
          Ch.
        </label>
        <div className="chapter-toolbar">
          <button
            type="button"
            className="step-btn"
            aria-label="Previous chapter"
            disabled={chapter <= 1}
            onClick={() => onChapterChange(Math.max(1, chapter - 1))}
          >
            ‹
          </button>
          <input
            id="chapter-range"
            type="range"
            className="chapter-range"
            min={1}
            max={maxCh}
            value={safeChapter}
            onChange={(e) => onChapterChange(Number(e.target.value))}
            aria-valuemin={1}
            aria-valuemax={maxCh}
            aria-valuenow={safeChapter}
          />
          <button
            type="button"
            className="step-btn"
            aria-label="Next chapter"
            disabled={!canNext}
            onClick={() => onChapterChange(Math.min(maxCh, chapter + 1))}
          >
            ›
          </button>
          <input
            id="chapter-num"
            type="number"
            className="chapter-num-input"
            min={1}
            max={chapterMax ?? undefined}
            value={chapter}
            aria-label="Chapter number"
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              onChapterChange(Math.max(1, n));
            }}
          />
          {chapterMax != null && chapterMax > 0 ? (
            <span className="chapter-denom" aria-hidden>
              / {chapterMax}
            </span>
          ) : (
            <span className="chapter-denom muted" title="Chapter count when available">
              / ?
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}

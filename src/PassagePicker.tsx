import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { WsBookDef } from "./constants";
import { ChapterSlider } from "./ChapterSlider";

const OT_LAST_ID = 39;

export type BookRow = { def: WsBookDef; chapters?: number };

type Props = {
  rows: BookRow[];
  bookId: number;
  onBookChange: (id: number) => void;
  chapter: number;
  onChapterChange: (n: number) => void;
  chapterMax?: number;
  /** Tighter book/chapter row for narrow viewports (paired with `.passage-picker--compact` CSS). */
  compact?: boolean;
  /** Rendered at the start of the passage row (e.g. menu + loading on mobile). */
  mobileToolbar?: ReactNode;
};

function bookLabel(r: BookRow): string {
  const ch = r.chapters ? ` (${r.chapters})` : "";
  return `${r.def.en} · ${r.def.ws}${ch}`;
}

function matchesQuery(r: BookRow, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  return (
    r.def.en.toLowerCase().includes(q) ||
    r.def.ws.includes(raw.trim()) ||
    String(r.def.id).includes(raw.trim())
  );
}

export function PassagePicker({
  rows,
  bookId,
  onBookChange,
  chapter,
  onChapterChange,
  chapterMax,
  compact = false,
  mobileToolbar,
}: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const chapterPopoverRef = useRef<HTMLDivElement>(null);
  const [chapterPopoverOpen, setChapterPopoverOpen] = useState(false);

  /** True while the combobox is active: filter uses `query`; when false, field shows committed book label. */
  const [focused, setFocused] = useState(false);
  /** Filter text while searching (empty ⇒ show all books in order). */
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const currentRow = rows.find((r) => r.def.id === bookId);

  /** What appears in the input: committed label when idle; live query while focused. */
  const inputValue = focused ? query : currentRow ? bookLabel(currentRow) : "";

  const suggestions = useMemo(
    () => rows.filter((r) => matchesQuery(r, focused ? query : "")),
    [rows, focused, query],
  );

  const { otRows, ntRows } = useMemo(() => {
    const ot = suggestions.filter((r) => r.def.id <= OT_LAST_ID);
    const nt = suggestions.filter((r) => r.def.id > OT_LAST_ID);
    return { otRows: ot, ntRows: nt };
  }, [suggestions]);

  const flatList = useMemo(() => [...otRows, ...ntRows], [otRows, ntRows]);

  const listOpen = focused && rows.length > 0;

  // After focusing with empty query, jump highlight to the current book in the full list.
  useEffect(() => {
    if (!focused || query.trim() !== "") return;
    const i = flatList.findIndex((r) => r.def.id === bookId);
    setHighlight(i >= 0 ? i : 0);
  }, [focused, query, bookId, flatList]);

  const pick = useCallback(
    (r: BookRow) => {
      onBookChange(r.def.id);
      setQuery("");
      setFocused(false);
      setHighlight(0);
      inputRef.current?.blur();
    },
    [onBookChange],
  );

  const onInputChange = (v: string) => {
    setQuery(v);
    setHighlight(0);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!listOpen || flatList.length === 0) {
      if (e.key === "Escape") {
        e.preventDefault();
        inputRef.current?.blur();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(flatList.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = flatList[highlight];
      if (r) pick(r);
    } else if (e.key === "Escape") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    if (!listOpen || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, listOpen]);

  useEffect(() => {
    if (flatList.length === 0) return;
    if (highlight > flatList.length - 1) setHighlight(flatList.length - 1);
  }, [flatList.length, highlight]);

  useEffect(() => {
    if (!chapterPopoverOpen) return;
    const onDocPointer = (e: PointerEvent) => {
      const el = chapterPopoverRef.current;
      if (el && !el.contains(e.target as Node)) setChapterPopoverOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setChapterPopoverOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [chapterPopoverOpen]);

  const maxCh = chapterMax && chapterMax > 0 ? chapterMax : 150;
  const safeChapter = Math.min(Math.max(1, chapter), maxCh);
  const canNext = chapterMax != null && chapterMax > 0 ? chapter < chapterMax : false;

  const chapterGridPopover =
    chapterPopoverOpen && maxCh > 1 ? (
      <div
        id={`${listId}-chapter-grid`}
        className="chapter-grid-popover"
        role="dialog"
        aria-label={`Chapters 1–${maxCh}`}
      >
        <div className="chapter-grid-popover-inner">
          {Array.from({ length: maxCh }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`chapter-grid-btn${n === safeChapter ? " is-current" : ""}`}
              aria-current={n === safeChapter ? "true" : undefined}
              onClick={() => {
                onChapterChange(n);
                setChapterPopoverOpen(false);
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const renderOption = (r: BookRow, idx: number) => {
    const hi = highlight === idx;
    return (
      <li
        key={r.def.id}
        role="option"
        data-idx={idx}
        id={`${listId}-opt-${r.def.id}`}
        aria-selected={hi}
        className={`book-autocomplete-option${hi ? " is-highlighted" : ""}`}
        onMouseDown={(ev) => {
          ev.preventDefault();
          pick(r);
        }}
        onMouseEnter={() => setHighlight(idx)}
      >
        <span className="book-autocomplete-en">{r.def.en}</span>
        <span className="book-autocomplete-sep" aria-hidden>
          ·
        </span>
        <span className="book-autocomplete-zh">{r.def.ws}</span>
        {r.chapters != null && r.chapters > 0 ? (
          <span className="book-autocomplete-ch" aria-hidden>
            {r.chapters} ch
          </span>
        ) : null}
      </li>
    );
  };

  return (
    <nav
      className={`passage-picker${compact ? " passage-picker--compact" : ""}`}
      aria-label="Passage"
    >
      <div className="passage-picker-row">
        {compact && mobileToolbar ? (
          <div className="passage-picker-mobile-toolbar">{mobileToolbar}</div>
        ) : null}
        <div className="passage-books passage-books-search">
          <label htmlFor={listId} className="sr-only">
            Search or select book
          </label>
          <div className={`book-search-wrap${listOpen ? " is-open" : ""}`}>
            <div className="book-search-input-track">
              <input
                ref={inputRef}
                id={listId}
                type="search"
                role="combobox"
                aria-expanded={listOpen}
                aria-controls={`${listId}-listbox`}
                aria-activedescendant={
                  listOpen && flatList[highlight] ? `${listId}-opt-${flatList[highlight].def.id}` : undefined
                }
                aria-autocomplete="list"
                className="input-biblical book-search-input"
                placeholder={focused ? (compact ? "Filter…" : "Type to filter…") : compact ? "Book" : "Search or open for all books…"}
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="search"
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={() => {
                  setFocused(true);
                  setQuery("");
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    setFocused(false);
                    setQuery("");
                  }, 150);
                }}
                onKeyDown={onKeyDown}
              />
            </div>
            {listOpen && flatList.length > 0 ? (
              <ul
                ref={listRef}
                id={`${listId}-listbox`}
                className="book-autocomplete"
                role="listbox"
                aria-label="All books"
              >
                <li className="book-autocomplete-hint" role="presentation">
                  {query.trim() ? "Matching books" : "All books (canonical order)"}
                </li>
                {otRows.length > 0 ? (
                  <>
                    <li className="book-autocomplete-heading" role="presentation">
                      Old Testament
                    </li>
                    {otRows.map((r, i) => renderOption(r, i))}
                  </>
                ) : null}
                {ntRows.length > 0 ? (
                  <>
                    <li className="book-autocomplete-heading" role="presentation">
                      New Testament
                    </li>
                    {ntRows.map((r, i) => renderOption(r, otRows.length + i))}
                  </>
                ) : null}
              </ul>
            ) : focused && query.trim() && flatList.length === 0 ? (
              <div className="book-autocomplete-empty" role="status">
                No books match
              </div>
            ) : null}
          </div>
        </div>

        <div className="passage-picker-divider" aria-hidden="true" />

        <div className="passage-chapter">
          <span
            className={`chapter-section-label${compact ? " sr-only" : ""}`}
            id="chapter-range-label"
          >
            Chapter
          </span>
          <div className="chapter-toolbar" role="group" aria-labelledby="chapter-range-label">
            {compact ? (
              <div className="chapter-popover-anchor" ref={chapterPopoverRef}>
                <button
                  type="button"
                  className={`chapter-picker-chip${chapterPopoverOpen ? " is-open" : ""}`}
                  aria-expanded={chapterPopoverOpen}
                  aria-controls={maxCh > 1 ? `${listId}-chapter-grid` : undefined}
                  aria-haspopup={maxCh > 1 ? "dialog" : undefined}
                  aria-label={
                    chapterMax != null && chapterMax > 0
                      ? `Chapter ${safeChapter} of ${chapterMax}, open chapter list`
                      : `Chapter ${safeChapter}, open chapter list`
                  }
                  disabled={maxCh <= 1}
                  onClick={() => maxCh > 1 && setChapterPopoverOpen((o) => !o)}
                >
                  <span className="chapter-picker-chip__value" aria-hidden>
                    {safeChapter}
                  </span>
                  {chapterMax != null && chapterMax > 0 ? (
                    <span className="chapter-picker-chip__denom" aria-hidden>
                      {" "}
                      / {chapterMax}
                    </span>
                  ) : (
                    <span className="chapter-picker-chip__denom chapter-picker-chip__denom--unknown" aria-hidden>
                      {" "}
                      / ?
                    </span>
                  )}
                  {maxCh > 1 ? (
                    <svg className="chapter-picker-chip__caret" width="11" height="11" viewBox="0 0 12 12" aria-hidden>
                      <path fill="currentColor" d="M6 8.2 1.8 4h8.4L6 8.2z" />
                    </svg>
                  ) : null}
                </button>
                {chapterGridPopover}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="step-btn"
                  aria-label="Previous chapter"
                  disabled={chapter <= 1}
                  onClick={() => onChapterChange(Math.max(1, chapter - 1))}
                >
                  ‹
                </button>
                <div className="chapter-slider-cluster" ref={chapterPopoverRef}>
                  <ChapterSlider
                    id="chapter-range"
                    min={1}
                    max={maxCh}
                    value={safeChapter}
                    onChange={onChapterChange}
                    aria-labelledby="chapter-range-label"
                    disabled={maxCh <= 1}
                  />
                  <button
                    type="button"
                    className={`chapter-grid-toggle${chapterPopoverOpen ? " is-open" : ""}`}
                    aria-expanded={chapterPopoverOpen}
                    aria-controls={maxCh > 1 ? `${listId}-chapter-grid` : undefined}
                    aria-haspopup="dialog"
                    aria-label="Open chapter picker: choose any chapter"
                    disabled={maxCh <= 1}
                    title="All chapters"
                    onClick={() => setChapterPopoverOpen((o) => !o)}
                  >
                    <svg className="chapter-grid-toggle-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                      {[0, 1, 2].flatMap((row) =>
                        [0, 1, 2].map((col) => (
                          <rect
                            key={`${row}-${col}`}
                            x={1 + col * 5}
                            y={1 + row * 5}
                            width="4"
                            height="4"
                            rx="1"
                            fill="currentColor"
                          />
                        )),
                      )}
                    </svg>
                  </button>
                  {chapterGridPopover}
                </div>
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
                  className="input-biblical chapter-num-input"
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
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

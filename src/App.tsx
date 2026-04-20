import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BOLLS, WS_BOOKS } from "./constants";
import redLetterRaw from "./data/red-letter-verses.json";
import {
  DEFAULT_EN_TRANSLATION,
  fetchEnglishTranslations,
  loadStoredEnTranslation,
  persistEnTranslation,
  type BollsTranslation,
} from "./bollsTranslations";
import { fetchJson } from "./api";
import { fetchExistingWsBookSet, fetchWikisourceWikitext } from "./wikisource";
import { extractVersesForChapter, type WikiVerse } from "./parseWiki";
import { stripHtml } from "./strings";
import { useChineseFont } from "./useChineseFont";
import { useParallelScroll } from "./useParallelScroll";
import { ClassicalPane } from "./ClassicalPane";
import { PassagePicker, type BookRow } from "./PassagePicker";
import "./index.css";

type BollsBook = { bookid: string; chapters?: number };

const LOAD_DEBOUNCE_MS = 280;

const redLetter = redLetterRaw as Record<string, Record<string, number[]>>;
function isRedLetter(bookId: number, chapter: number, verse: number): boolean {
  return redLetter[String(bookId)]?.[String(chapter)]?.includes(verse) ?? false;
}

const OPEN_QUOTE = "\u201C"; // "
const CLOSE_QUOTE = "\u201D"; // "

function renderEnRedLetter(text: string, startsInQuote = false) {
  const parts: React.ReactNode[] = [];
  let inQuote = startsInQuote;
  let segStart = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === OPEN_QUOTE && !inQuote) {
      if (i > segStart) parts.push(text.slice(segStart, i));
      segStart = i;
      inQuote = true;
    } else if (text[i] === CLOSE_QUOTE && inQuote) {
      parts.push(<span className="words-of-jesus" key={i}>{text.slice(segStart, i + 1)}</span>);
      segStart = i + 1;
      inQuote = false;
    }
  }
  if (segStart < text.length) {
    const tail = text.slice(segStart);
    parts.push(inQuote ? <span className="words-of-jesus" key="tail">{tail}</span> : tail);
  }
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return <>{parts}</>;
}

/** True when every character of `text` is rendered inside red-letter spans (matches {@link renderEnRedLetter}). */
function enVerseIsEntirelyRedLetter(text: string, startsInQuote: boolean): boolean {
  if (text.length === 0) return false;
  let inQuote = startsInQuote;
  let segStart = 0;
  let hasBlack = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === OPEN_QUOTE && !inQuote) {
      if (i > segStart) hasBlack = true;
      segStart = i;
      inQuote = true;
    } else if (ch === CLOSE_QUOTE && inQuote) {
      segStart = i + 1;
      inQuote = false;
    }
  }
  if (segStart < text.length && !inQuote) hasBlack = true;
  return !hasBlack;
}

export default function App() {
  const { fontId, setFontId, presets } = useChineseFont();
  const [scrollRevision, setScrollRevision] = useState(0);
  const { enScrollRef, zhHorizontalRef } = useParallelScroll(scrollRevision);

  const [bookOptions, setBookOptions] = useState<BookRow[]>([]);
  const [bookId, setBookId] = useState(43);
  const [chapter, setChapter] = useState(3);
  const [enTranslation, setEnTranslation] = useState(loadStoredEnTranslation);
  const [enTranslations, setEnTranslations] = useState<BollsTranslation[]>([]);
  const [redLetterOn, setRedLetterOn] = useState<boolean>(() => {
    try { return localStorage.getItem("bible-red-letter") !== "off"; } catch { return true; }
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem("bible-theme");
      if (s === "dark" || s === "light") return s === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    try {
      localStorage.setItem("bible-theme", darkMode ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [darkMode]);
  const [zhVerses, setZhVerses] = useState<WikiVerse[]>([]);
  const [enVerses, setEnVerses] = useState<{ verse: number; text: string }[]>([]);
  const [zhRefLine, setZhRefLine] = useState("");
  const [enRefLine, setEnRefLine] = useState("");
  const [zhStatus, setZhStatus] = useState("");
  const [enStatus, setEnStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredVerse, setHoveredVerse] = useState<number | null>(null);

  // Pre-process English verses: strip HTML and carry open-quote state across consecutive
  // red-letter verses so multi-verse speeches stay highlighted end-to-end.
  const processedEnVerses = useMemo(() => {
    let inQuote = false;
    return enVerses.map((v) => {
      const text = stripHtml(v.text);
      const red = isRedLetter(bookId, chapter, v.verse);
      if (!red) {
        inQuote = false; // non-red-letter verse breaks continuity
        return { verse: v.verse, text, startsInQuote: false };
      }
      const startsInQuote = inQuote;
      for (const ch of text) {
        if (ch === OPEN_QUOTE && !inQuote) inQuote = true;
        else if (ch === CLOSE_QUOTE && inQuote) inQuote = false;
      }
      return { verse: v.verse, text, startsInQuote };
    });
  }, [enVerses, bookId, chapter]);

  /** Verses whose English text is 100% red-letter; used to force full-verse red on 文言 when 曰/○ never open speech. */
  const englishFullyRedVerses = useMemo(() => {
    const s = new Set<number>();
    if (!redLetterOn) return s;
    for (const v of processedEnVerses) {
      if (!isRedLetter(bookId, chapter, v.verse)) continue;
      if (enVerseIsEntirelyRedLetter(v.text, v.startsInQuote)) s.add(v.verse);
    }
    return s;
  }, [processedEnVerses, redLetterOn, bookId, chapter]);

  const enFullName = useMemo(
    () => enTranslations.find((t) => t.short_name === enTranslation)?.full_name ?? enTranslation,
    [enTranslations, enTranslation],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchEnglishTranslations()
      .then((list) => {
        if (cancelled || !list.length) return;
        setEnTranslations(list);
      })
      .catch(() => {
        if (cancelled) return;
        setEnTranslations([
          { short_name: "NIV2011", full_name: "New International Version, 2011" },
          { short_name: "NIV", full_name: "New International Version, 1984" },
          { short_name: "ESV", full_name: "English Standard Version" },
          { short_name: "KJV", full_name: "King James Version" },
          { short_name: "NKJV", full_name: "New King James Version" },
        ]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enTranslations.length) return;
    if (!enTranslations.some((t) => t.short_name === enTranslation)) {
      setEnTranslation(DEFAULT_EN_TRANSLATION);
    }
  }, [enTranslations, enTranslation]);

  useEffect(() => {
    persistEnTranslation(enTranslation);
  }, [enTranslation]);

  const loadGeneration = useRef(0);
  const flightRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current != null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bollsBooks, wsPresent] = await Promise.all([
          fetchJson(`${BOLLS}/get-books/${enTranslation}/`) as Promise<BollsBook[]>,
          fetchExistingWsBookSet(),
        ]);
        if (cancelled) return;
        const byId = Object.fromEntries(bollsBooks.map((b) => [String(b.bookid), b]));
        const opts: BookRow[] = [];
        for (const def of WS_BOOKS) {
          if (!wsPresent.has(def.ws)) continue;
          const b = byId[String(def.id)];
          opts.push({ def, chapters: b?.chapters });
        }
        if (!opts.length) {
          throw new Error("維基文庫上找不到《聖經 (文理和合)》任何子頁；請稍後再試。");
        }
        setBookOptions(opts);
        setBookId((prev) => (opts.some((o) => o.def.id === prev) ? prev : opts.find((o) => o.def.id === 43)?.def.id ?? opts[0].def.id));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setZhStatus(`Could not initialize: ${msg}`);
        setEnStatus(`Could not initialize: ${msg}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enTranslation]);

  const chapterMax = bookOptions.find((o) => o.def.id === bookId)?.chapters;

  useEffect(() => {
    if (chapterMax != null && chapterMax > 0 && chapter > chapterMax) {
      setChapter(chapterMax);
    }
  }, [chapterMax, chapter]);

  const runLoad = useCallback(async () => {
    flightRef.current?.abort();
    const ac = new AbortController();
    flightRef.current = ac;
    const signal = ac.signal;
    const myGen = ++loadGeneration.current;

    setLoading(true);
    setZhStatus("");
    setEnStatus("");

    const def = WS_BOOKS.find((b) => b.id === bookId);
    if (!def) {
      setZhStatus("Unknown book id.");
      setEnStatus("Unknown book id.");
      if (myGen === loadGeneration.current) setLoading(false);
      return;
    }
    const ch = Math.max(1, Math.floor(Number(chapter)) || 1);
    const label = `${def.en} · ${def.ws}`;

    try {
      const [{ wikitext, title }, enRaw] = await Promise.all([
        fetchWikisourceWikitext(def.ws, signal),
        fetchJson(`${BOLLS}/get-text/${enTranslation}/${bookId}/${ch}/`, { signal }) as Promise<
          { verse: number; text: string }[]
        >,
      ]);

      if (signal.aborted || myGen !== loadGeneration.current) return;

      const zh = extractVersesForChapter(wikitext, ch);
      if (!zh.length) {
        throw new Error(
          `維基文庫此卷未解析到第 ${ch} 節（頁面「${title}」）。請確認該章存在，或章節標記與源文一致。`,
        );
      }

      const ref = `${label} ${ch}`;
      setZhRefLine(`${ref}`);
      setEnRefLine(`${ref} · ${enTranslation}`);
      setZhVerses(zh);
      setEnVerses(enRaw);
      setScrollRevision((n) => n + 1);
    } catch (e) {
      if (signal.aborted || myGen !== loadGeneration.current) return;
      if (e instanceof DOMException && e.name === "AbortError") return;
      const msg = e instanceof Error ? e.message : String(e);
      setZhStatus(msg);
      setEnStatus(msg);
    } finally {
      if (myGen === loadGeneration.current) setLoading(false);
    }
  }, [bookId, chapter, enTranslation]);

  useEffect(() => {
    if (!bookOptions.length) return;
    clearDebounceTimer();
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      void runLoad();
    }, LOAD_DEBOUNCE_MS);
    return () => {
      clearDebounceTimer();
      flightRef.current?.abort();
    };
  }, [bookId, chapter, enTranslation, bookOptions.length, runLoad, clearDebounceTimer]);

  const handleBookChange = useCallback((id: number) => {
    setBookId(id);
    setChapter(1);
  }, []);

  const handleChapterChange = useCallback(
    (n: number) => {
      const max = chapterMax && chapterMax > 0 ? chapterMax : 999;
      setChapter(Math.min(max, Math.max(1, Math.floor(n))));
    },
    [chapterMax],
  );

  const forceReload = useCallback(() => {
    clearDebounceTimer();
    void runLoad();
  }, [runLoad, clearDebounceTimer]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-toolbar">
          <h1>Parallel Bible</h1>
          <div className="header-settings">
            <div className="setting-inline setting-en-translation">
              <label htmlFor="en-translation">English</label>
              <select
                id="en-translation"
                className="select-compact select-en-translation"
                aria-label="English Bible translation"
                value={enTranslation}
                disabled={enTranslations.length === 0}
                onChange={(e) => setEnTranslation(e.target.value)}
              >
                {enTranslations.length === 0 ? (
                  <option value={enTranslation}>{enTranslation}</option>
                ) : (
                  enTranslations.map((t) => (
                    <option key={t.short_name} value={t.short_name} title={t.full_name}>
                      {t.short_name} — {t.full_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              type="button"
              className={`btn-toggle${redLetterOn ? " is-on" : ""}`}
              aria-pressed={redLetterOn}
              onClick={() =>
                setRedLetterOn((v) => {
                  const next = !v;
                  try { localStorage.setItem("bible-red-letter", next ? "on" : "off"); } catch {}
                  return next;
                })
              }
              title="Toggle red-letter (words of Jesus)"
            >
              Red letter
            </button>
            <button
              type="button"
              className={`btn-theme${darkMode ? " is-dark" : ""}`}
              aria-pressed={darkMode}
              onClick={() => setDarkMode((v) => !v)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="btn-theme-icon" aria-hidden>
                {darkMode ? "☀" : "☽"}
              </span>
              <span className="btn-theme-text">{darkMode ? "Light" : "Dark"}</span>
            </button>
            <div className="setting-inline">
              <label htmlFor="zh-font">字體</label>
              <select
                id="zh-font"
                className="select-compact select-zh-font"
                aria-label="Chinese column font"
                value={fontId}
                onChange={(e) => setFontId(e.target.value)}
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn-refresh"
              onClick={forceReload}
              disabled={loading}
              title="Reload passage"
            >
              Reload
            </button>
          </div>
          <span className={`load-indicator ${loading ? "is-loading" : ""}`} aria-live="polite">
            {loading ? "…" : ""}
          </span>
        </div>
        <div className={`loading-bar ${loading ? "is-active" : ""}`} aria-hidden />

        {bookOptions.length > 0 ? (
          <PassagePicker
            rows={bookOptions}
            bookId={bookId}
            onBookChange={handleBookChange}
            chapter={chapter}
            onChapterChange={handleChapterChange}
            chapterMax={chapterMax}
          />
        ) : null}
      </header>

      <main className="app-main" aria-busy={loading}>
        <ClassicalPane
          horizontalRef={zhHorizontalRef}
          verses={zhVerses}
          refLine={zhRefLine}
          status={zhStatus}
          hoveredVerse={hoveredVerse}
          onVerseHover={setHoveredVerse}
          redLetterVerses={redLetterOn ? new Set(redLetter[String(bookId)]?.[String(chapter)] ?? []) : new Set()}
          englishFullyRedVerses={englishFullyRedVerses}
        />

        <section className="pane" aria-labelledby="en-title">
          <div className="pane-head pane-head-en">
            <div className="pane-head-en-main">
              <h2 id="en-title">{enFullName}</h2>
              <div className="ref-line" aria-live="polite">
                {enRefLine}
              </div>
            </div>
            <div className="en-chapter-promo" aria-hidden="true">
              {chapter}
            </div>
          </div>
          <div ref={enScrollRef} className="pane-scroll-en" role="region" aria-label="English Bible scroll area">
            <div className="niv-verses" aria-label="English Bible text">
              {processedEnVerses.map((v) => (
                <p
                  key={v.verse}
                  className={`niv-verse${hoveredVerse === v.verse ? " is-hovered" : ""}`}
                  onMouseEnter={() => setHoveredVerse(v.verse)}
                  onMouseLeave={() => setHoveredVerse(null)}
                >
                  <span className="verse-num">{v.verse}</span>{" "}
                  {redLetterOn && isRedLetter(bookId, chapter, v.verse)
                    ? renderEnRedLetter(v.text, v.startsInQuote)
                    : v.text}
                </p>
              ))}
            </div>
          </div>
          <div className="status" role="status">
            {enStatus}
          </div>
        </section>
      </main>
    </div>
  );
}

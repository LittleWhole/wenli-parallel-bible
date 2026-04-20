import { useCallback, useEffect, useRef, useState } from "react";
import { BOLLS, WS_BOOKS } from "./constants";
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

export default function App() {
  const { fontId, setFontId, presets } = useChineseFont();
  const [scrollRevision, setScrollRevision] = useState(0);
  const { enScrollRef, zhHorizontalRef } = useParallelScroll(scrollRevision);

  const [bookOptions, setBookOptions] = useState<BookRow[]>([]);
  const [bookId, setBookId] = useState(43);
  const [chapter, setChapter] = useState(3);
  const [nivEdition, setNivEdition] = useState("NIV2011");
  const [zhVerses, setZhVerses] = useState<WikiVerse[]>([]);
  const [enVerses, setEnVerses] = useState<{ verse: number; text: string }[]>([]);
  const [zhRefLine, setZhRefLine] = useState("");
  const [enRefLine, setEnRefLine] = useState("");
  const [zhStatus, setZhStatus] = useState("");
  const [enStatus, setEnStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredVerse, setHoveredVerse] = useState<number | null>(null);

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
          fetchJson(`${BOLLS}/get-books/NIV2011/`) as Promise<BollsBook[]>,
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
        const john = opts.find((o) => o.def.id === 43);
        setBookId(john ? 43 : opts[0].def.id);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setZhStatus(`Could not initialize: ${msg}`);
        setEnStatus(`Could not initialize: ${msg}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
        fetchJson(`${BOLLS}/get-text/${nivEdition}/${bookId}/${ch}/`, { signal }) as Promise<
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
      setEnRefLine(`${ref} · ${nivEdition}`);
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
  }, [bookId, chapter, nivEdition]);

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
  }, [bookId, chapter, nivEdition, bookOptions.length, runLoad, clearDebounceTimer]);

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
            <div className="setting-inline">
              <label htmlFor="niv-edition">NIV</label>
              <select
                id="niv-edition"
                className="select-compact"
                aria-label="NIV edition"
                value={nivEdition}
                onChange={(e) => setNivEdition(e.target.value)}
              >
                <option value="NIV2011">2011</option>
                <option value="NIV">1984</option>
              </select>
            </div>
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
        />

        <section className="pane" aria-labelledby="en-title">
          <div className="pane-head">
            <h2 id="en-title">New International Version</h2>
            <div className="ref-line" aria-live="polite">
              {enRefLine}
            </div>
          </div>
          <div ref={enScrollRef} className="pane-scroll-en" role="region" aria-label="NIV scroll area">
            <div className="niv-verses" aria-label="NIV text">
              {enVerses.map((v) => (
                <p
                  key={v.verse}
                  className={`niv-verse${hoveredVerse === v.verse ? " is-hovered" : ""}`}
                  onMouseEnter={() => setHoveredVerse(v.verse)}
                  onMouseLeave={() => setHoveredVerse(null)}
                >
                  <span className="verse-num">{v.verse}</span> {stripHtml(v.text)}
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

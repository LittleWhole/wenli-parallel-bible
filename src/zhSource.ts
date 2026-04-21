export type ZhSource = "wenli" | "meiji";

/** First Bolls book id that loads from 明治元訳新約聖書（大正4年） on ja.wikisource (Matthew = 40). */
export const MEIJI_NT_FIRST_BOOK_ID = 40;

export function meijiIsNewTestament(bookId: number): boolean {
  return bookId >= MEIJI_NT_FIRST_BOOK_ID;
}

/** Pane heading for the classical column when 明治元譯 is selected (source switches with the active book). */
export function meijiClassicalPaneTitle(bookId: number): string {
  return meijiIsNewTestament(bookId) ? "明治元譯 · 新約（大正四年）" : "明治元譯 · 舊約（文語訳）";
}

export const ZH_SOURCE_STORAGE_KEY = "bible-study-zh-source";

export function loadZhSource(): ZhSource {
  try {
    const s = localStorage.getItem(ZH_SOURCE_STORAGE_KEY);
    if (s === "meiji" || s === "wenli") return s;
  } catch {
    /* ignore */
  }
  return "wenli";
}

export function persistZhSource(s: ZhSource) {
  try {
    localStorage.setItem(ZH_SOURCE_STORAGE_KEY, s);
  } catch {
    /* ignore */
  }
}

export const ZH_SOURCE_LABEL: Record<ZhSource, string> = {
  wenli: "文理和合 Wenli Union",
  meiji: "明治元譯 Meiji — OT 文語訳 / NT 大正四年",
};

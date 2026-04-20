export type ZhSource = "wenli" | "meiji";

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
  wenli: "文理和合（維基文庫）",
  meiji: "明治元譯（日語 WikiSource・新約大正四年／振假名）",
};

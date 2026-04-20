import { BOLLS } from "./constants";
import { fetchJson } from "./api";

export type BollsTranslation = {
  short_name: string;
  full_name: string;
  updated?: number;
};

type LanguagesJson = { language: string; translations: BollsTranslation[] }[];

/**
 * All English Bible translations available on bolls.life (NIV 1984/2011, ESV, KJV, NKJV, …).
 * Source: https://bolls.life/static/bolls/app/views/languages.json
 */
export async function fetchEnglishTranslations(): Promise<BollsTranslation[]> {
  const data = (await fetchJson(
    `${BOLLS}/static/bolls/app/views/languages.json`,
  )) as LanguagesJson;
  const group = data.find(
    (g) =>
      typeof g.language === "string" &&
      (g.language.startsWith("English") || g.language.includes("English")),
  );
  const list = group?.translations ?? [];
  return [...list].sort((a, b) => a.short_name.localeCompare(b.short_name, "en"));
}

export const DEFAULT_EN_TRANSLATION = "NIV2011";

export function loadStoredEnTranslation(): string {
  try {
    const s = localStorage.getItem("bible-en-translation");
    if (s && /^[A-Za-z0-9_-]+$/.test(s)) return s;
  } catch {
    /* ignore */
  }
  return DEFAULT_EN_TRANSLATION;
}

export function persistEnTranslation(slug: string) {
  try {
    localStorage.setItem("bible-en-translation", slug);
  } catch {
    /* ignore */
  }
}

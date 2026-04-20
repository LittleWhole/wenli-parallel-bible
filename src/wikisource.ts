import { WS_API, WS_PREFIX } from "./constants";
import { fetchJson } from "./api";

export function wsPageTitle(wsBook: string) {
  return `${WS_PREFIX}/${wsBook}`;
}

export async function fetchWikisourceWikitext(wsBook: string, signal?: AbortSignal) {
  const title = wsPageTitle(wsBook);
  const url = `${WS_API}?action=parse&prop=wikitext&format=json&origin=*&page=${encodeURIComponent(title)}`;
  const data = await fetchJson(url, { signal });
  if (!data.parse?.wikitext || data.parse.wikitext["*"] == null) {
    throw new Error("Wikisource parse: missing wikitext");
  }
  return { title, wikitext: data.parse.wikitext["*"] as string };
}

/** Subpage basenames that exist under the configured `WS_PREFIX` work on zh.wikisource. */
export async function fetchExistingWsBookSet(): Promise<Set<string>> {
  const url = `${WS_API}?action=query&list=allpages&apprefix=${encodeURIComponent(`${WS_PREFIX}/`)}&aplimit=500&format=json&origin=*`;
  const data = await fetchJson(url);
  const pages = data.query?.allpages ?? [];
  return new Set(pages.map((p: { title: string }) => p.title.split("/").pop()));
}

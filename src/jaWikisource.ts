import { fetchJson } from "./api";

const JA_WS_API = "https://ja.wikisource.org/w/api.php";

export async function fetchJaWikisourceWikitext(pageTitle: string, signal?: AbortSignal) {
  const url = `${JA_WS_API}?action=parse&prop=wikitext&format=json&origin=*&page=${encodeURIComponent(pageTitle)}`;
  const data = await fetchJson(url, { signal });
  if (!data.parse?.wikitext || data.parse.wikitext["*"] == null) {
    throw new Error("Japanese Wikisource parse: missing wikitext");
  }
  return { title: data.parse.title as string, wikitext: data.parse.wikitext["*"] as string };
}

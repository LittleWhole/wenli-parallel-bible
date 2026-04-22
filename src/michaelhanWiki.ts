import { fetchJson } from "./api";

/**
 * Han Wiki page source. Browsers block cross-origin requests to `wiki.michaelhan.net` (CORS), so the app calls
 * **same-origin** `/__hanwiki/...` instead:
 * - **Vite dev / `vite preview`:** proxied in `vite.config.ts`
 * - **Netlify:** `public/_redirects` rewrites to the wiki
 * - **Other hosts:** configure the same rewrite, or set `VITE_MICHAELHAN_API` to the proxy prefix (e.g. `/__hanwiki`)
 *
 * We use MediaWiki **REST** `GET /rest.php/v1/page/{title}` (JSON `source` = wikitext). The legacy
 * `api.php?action=parse` path often returns **404** for non-browser clients on this wiki (e.g. Vite proxy).
 *
 * @see {@link https://wiki.michaelhan.net/국한문성경}
 */
export function michaelHanWikiPrefix(): string {
  const fromEnv = import.meta.env.VITE_MICHAELHAN_API as string | undefined;
  const raw = fromEnv?.trim();
  if (!raw) return "/__hanwiki";
  return raw.replace(/\/?api\.php$/i, "");
}

export async function fetchMichaelHanWikitext(pageTitle: string, signal?: AbortSignal) {
  const prefix = michaelHanWikiPrefix();
  const path = `/rest.php/v1/page/${encodeURIComponent(pageTitle)}`;
  const url = `${prefix}${path}`;
  const data = await fetchJson(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (typeof data.source !== "string") {
    throw new Error("Han Wiki REST: missing page source (wikitext)");
  }
  return { title: (data.title as string) ?? pageTitle, wikitext: data.source };
}

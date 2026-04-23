import { fetchJson } from "./api";

/**
 * Han Wiki page source. Browsers block cross-origin requests to `wiki.michaelhan.net` (CORS), so the app calls
 * **same-origin** `/__hanwiki/...` instead:
 * - **Vite dev / `vite preview`:** proxied in `vite.config.ts`
 * - **Netlify:** `public/_redirects` rewrites to the wiki
 * - **Vercel:** `vercel.json` rewrites `/__hanwiki/:path*` → `https://wiki.michaelhan.net/:path*` (Netlify’s `_redirects` is ignored on Vercel)
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
  let data: unknown;
  try {
    data = await fetchJson(url, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.startsWith("404")) {
      throw new Error(
        `Han Wiki 404 for “${pageTitle}”. Either the page is missing on wiki.michaelhan.net, or your app URL is not proxying ${prefix}/ to that wiki (required for CORS). ` +
          `If this only happens on your phone while developing: open http://YOUR_PC_LAN_IP:5173 — not http://localhost:5173 (localhost on the phone is the phone itself). ` +
          `Production: proxy /__hanwiki/* to wiki.michaelhan.net (Netlify: public/_redirects; Vercel: vercel.json rewrites), or set VITE_MICHAELHAN_API.`,
      );
    }
    throw e;
  }
  if (typeof (data as { source?: unknown }).source !== "string") {
    throw new Error("Han Wiki REST: missing page source (wikitext)");
  }
  const d = data as { source: string; title?: string };
  return { title: d.title ?? pageTitle, wikitext: d.source };
}

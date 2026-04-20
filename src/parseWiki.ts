/** Parse `{{verse|…}}` inner text → chapter number + verse label. */
export function parseVerseInner(inner: string) {
  const s = inner.trim();
  if (s.includes("chapter=")) {
    let chapter = NaN;
    let verse = "";
    for (const part of s.split("|")) {
      const mc = part.match(/^\s*chapter\s*=\s*(\d+)\s*$/i);
      const mv = part.match(/^\s*verse\s*=\s*(.+)$/i);
      if (mc) chapter = parseInt(mc[1], 10);
      if (mv) verse = mv[1].trim();
    }
    return { chapter, verse };
  }
  const parts = s.split("|").map((p) => p.trim());
  if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
    const chapter = parseInt(parts[0], 10);
    let rest = parts.slice(1).join("|");
    if (/^verse\s*=/i.test(rest)) rest = rest.replace(/^verse\s*=\s*/i, "").trim();
    return { chapter, verse: rest };
  }
  return { chapter: NaN, verse: "" };
}

export function verseSortKey(verseLabel: string) {
  const m = String(verseLabel).match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

export function cleanWikiVerseText(raw: string) {
  let t = raw;
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2");
  t = t.replace(/\[\[([^\]]+)\]\]/g, "$1");
  // Extract the display text from single-pipe templates like {{ul|亞伯拉罕}} → 亞伯拉罕.
  // Run twice to handle adjacent/nested occurrences.
  t = t.replace(/\{\{[^|{}]+\|([^|{}]+)\}\}/g, "$1");
  t = t.replace(/\{\{[^|{}]+\|([^|{}]+)\}\}/g, "$1");
  // Remove any remaining templates (multi-arg, no content, etc.).
  t = t.replace(/\{\{[^}]*\}\}/g, "");
  t = t.replace(/[ \t\u3000]+/g, " ").trim();
  return t;
}

export type WikiVerse = { verse: string; text: string };

export function extractVersesForChapter(wikitext: string, targetChapter: number): WikiVerse[] {
  const re = /\{\{verse\|([^}]+)\}\}/g;
  const found: WikiVerse[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(wikitext)) !== null) {
    const inner = m[1];
    const { chapter, verse } = parseVerseInner(inner);
    if (chapter !== targetChapter || !verse) continue;

    const start = m.index + m[0].length;
    const rest = wikitext.slice(start);
    let end = rest.length;
    const c0 = rest.indexOf("{{verse|");
    const c1 = rest.indexOf("{{gototop}}");
    const c2 = rest.search(/\n==[^=\s][^\n]*==/);
    const c3 = rest.indexOf("\n<p>{{verse|");
    for (const c of [c0, c1, c2, c3]) {
      if (c >= 0 && c < end) end = c;
    }
    const rawText = rest.slice(0, end);
    found.push({ verse, text: cleanWikiVerseText(rawText) });
  }
  found.sort(
    (a, b) =>
      verseSortKey(a.verse) - verseSortKey(b.verse) ||
      String(a.verse).localeCompare(String(b.verse), "zh-Hant"),
  );
  return found;
}

/** Radix trie for longest-match proper-noun lookup in O(step) per character. */
type TrieNode = { term?: string; next: Map<string, TrieNode> };

function makeNode(): TrieNode {
  return { next: new Map() };
}

export function buildProperNounTrie(words: readonly string[]): (text: string, start: number) => string | null {
  const root = makeNode();
  for (const w of words) {
    if (!w) continue;
    let n = root;
    for (const ch of w) {
      if (!n.next.has(ch)) n.next.set(ch, makeNode());
      n = n.next.get(ch)!;
    }
    n.term = w;
  }
  return (text: string, start: number) => {
    let n = root;
    let best: string | null = null;
    for (let j = start; j < text.length; j++) {
      const nx = n.next.get(text[j]);
      if (!nx) break;
      n = nx;
      if (n.term) best = n.term;
    }
    return best;
  };
}

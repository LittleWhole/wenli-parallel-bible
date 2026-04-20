/**
 * Japanese Wikisource「明治元訳新約聖書 (大正4年)」— page titles to load (concatenated in order).
 * Parent prefix differs: ASCII space + "(" vs fullwidth （…） before the slash.
 */
const P_AS = "明治元訳新約聖書 (大正4年)/";
const P_FW = "明治元訳新約聖書（大正4年)/";

/** Ordered wikitext pages per NT book (Bolls id 40–66). Single-page books use one entry. */
export const TAISHO4_NT_PAGE_TITLES: Record<number, readonly string[]> = {
  40: [
    `${P_AS}馬太傳福音書`,
    `${P_AS}馬太傳福音書 (2)`,
    `${P_FW}馬太傳福音書 (3)`,
    `${P_FW}馬太傳福音書（4)`,
    `${P_FW}馬太傳福音書（5)`,
  ],
  41: [`${P_AS}馬可傳福音書`, `${P_FW}馬可傳福音書 (2)`],
  42: [`${P_FW}路加傳福音書`, `${P_FW}路加傳福音書（2)`],
  43: [`${P_FW}約翰傳福音書`],
  44: [`${P_AS}使徒行傳`, `${P_FW}使徒行傳（2)`],
  45: [`${P_AS}羅馬人書`],
  46: [`${P_FW}哥林多人前書`],
  47: [`${P_FW}哥林多人後書`],
  48: [`${P_FW}加拉太人書`],
  49: [`${P_FW}以弗所人書`],
  50: [`${P_FW}腓立比人書`],
  51: [`${P_FW}哥羅西人書`],
  52: [`${P_FW}帖撒羅尼迦人前書`],
  53: [`${P_FW}帖撒羅尼迦人後書`],
  54: [`${P_FW}提摩太前書`],
  55: [`${P_FW}提摩太後書`],
  56: [`${P_FW}提多書`],
  57: [`${P_FW}腓利門書`],
  58: [`${P_FW}希伯來人書`],
  59: [`${P_FW}雅各書`],
  60: [`${P_FW}彼得前書`],
  61: [`${P_FW}彼得後書`],
  62: [`${P_FW}約翰第一書`],
  63: [`${P_FW}約翰第二書`],
  64: [`${P_FW}約翰第三書`],
  65: [`${P_FW}猶太書`],
  66: [`${P_FW}約翰黙示録`],
};

export function taisho4NtPageTitles(bookId: number): readonly string[] | null {
  const p = TAISHO4_NT_PAGE_TITLES[bookId];
  return p ?? null;
}

/**
 * Exact Japanese Wikisource page titles for the Meiji-era Bible:
 * OT = standalone `…` pages listed under
 * {@link https://ja.wikisource.org/wiki/明治元訳旧約聖書 明治元訳旧約聖書}
 * (Genesis also uses the first two `…(文語訳ルビ付)` parts — see {@link meijiOt.ts}).
 * NT is loaded from Taisho 4 pages in {@link taisho4Nt.ts}.
 * Book order matches {@link WS_BOOKS} ids 1–66.
 */
export const MEIJI_JA_BOOK_TITLE: readonly string[] = [
  "創世記",
  "出エジプト記",
  "レビ記",
  "民數紀略",
  "申命記",
  "ヨシュア記",
  "士師記",
  "ルツ記",
  "サムエル前書",
  "サムエル後書",
  "列王紀略上",
  "列王紀略下",
  "歴代志略上",
  "歴代志略下",
  "エズラ書",
  "ネヘミヤ記",
  "エステル書",
  "ヨブ記",
  "詩篇",
  "箴言",
  "傳道之書",
  "雅歌",
  "イザヤ書",
  "ヱレミヤ記",
  "エレミヤの哀歌",
  "エゼキエル書",
  "ダニエル書",
  "ホセア書",
  "ヨエル書",
  "アモス書",
  "オバデヤ書",
  "ヨナ書",
  "ミカ書",
  "ナホム書",
  "ハバクク書",
  "ゼパニヤ書",
  "ハガイ書",
  "ゼカリヤ書",
  "マラキ書",
  "馬太傳福音書(明治元訳)",
  "馬可傳福音書(明治元訳)",
  "路加傳福音書(明治元訳)",
  "約翰傳福音書(明治元訳)",
  "使徒行傳(明治元訳)",
  "羅馬書(明治元訳)",
  "哥林多前書(明治元訳)",
  "哥林多後書(明治元訳)",
  "加拉太書(明治元訳)",
  "以弗所書(明治元訳)",
  "腓立比書(明治元訳)",
  "哥羅西書(明治元訳)",
  "帖撒羅尼迦前書(明治元訳)",
  "帖撒羅尼迦後書(明治元訳)",
  "提摩太前書(明治元訳)",
  "提摩太後書(明治元訳)",
  "提多書(明治元訳)",
  "腓利門書(明治元訳)",
  "希伯來書(明治元訳)",
  "雅各書(明治元訳)",
  "彼得前書(明治元訳)",
  "彼得後書(明治元訳)",
  "約翰第一書(明治元訳)",
  "約翰第二書(明治元訳)",
  "約翰第三書(明治元訳)",
  "猶太書(明治元訳)",
  "約翰默示錄(明治元訳)",
];

export function meijiJaBookTitle(bookId: number): string | null {
  const i = bookId - 1;
  if (i < 0 || i >= MEIJI_JA_BOOK_TITLE.length) return null;
  return MEIJI_JA_BOOK_TITLE[i] ?? null;
}

/** Build Wikisource-style chapter titles: 第一章 … 第一百五十章 (for ja.wikisource Meiji NT subpages). */
const DIGIT = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

function belowHundred(n: number): string {
  if (n < 10) return DIGIT[n];
  if (n === 10) return "十";
  if (n < 20) return "十" + DIGIT[n % 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return DIGIT[tens] + "十" + (ones ? DIGIT[ones] : "");
}

/** 1 → 一, 11 → 十一, 20 → 二十, 150 → 一百五十 */
export function chapterToKanjiTitle(n: number): string {
  if (!Number.isFinite(n) || n < 1 || n > 200) return String(Math.max(1, Math.floor(n)));
  if (n < 100) return belowHundred(n);
  if (n === 100) return "百";
  if (n < 200) {
    const rest = n - 100;
    return "一" + "百" + (rest ? belowHundred(rest) : "");
  }
  return String(n);
}

export function meijiNtChapterPageSuffix(chapter: number): string {
  return `第${chapterToKanjiTitle(chapter)}章`;
}

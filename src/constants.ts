export const BOLLS = "https://bolls.life";
export const WS_API = "https://zh.wikisource.org/w/api.php";
/** zh.wikisource.org work: 《聖經 (文理和合)》 — e.g. …/箴言 */
export const WS_PREFIX = "聖經 (文理和合)";

/**
 * Protestant book order; `ws` must match the exact Wikisource subpage title after the slash
 * under {@link WS_PREFIX} (see Special:PrefixIndex on zh.wikisource).
 */
export const WS_BOOKS = [
  { id: 1, en: "Genesis", ws: "創世記" },
  { id: 2, en: "Exodus", ws: "出埃及記" },
  { id: 3, en: "Leviticus", ws: "利未記" },
  { id: 4, en: "Numbers", ws: "民數記" },
  { id: 5, en: "Deuteronomy", ws: "申命記" },
  { id: 6, en: "Joshua", ws: "約書亞記" },
  { id: 7, en: "Judges", ws: "士師記" },
  { id: 8, en: "Ruth", ws: "路得記" },
  { id: 9, en: "1 Samuel", ws: "撒母耳記上" },
  { id: 10, en: "2 Samuel", ws: "撒母耳記下" },
  { id: 11, en: "1 Kings", ws: "列王紀上" },
  { id: 12, en: "2 Kings", ws: "列王紀下" },
  { id: 13, en: "1 Chronicles", ws: "歷代志上" },
  { id: 14, en: "2 Chronicles", ws: "歷代志下" },
  { id: 15, en: "Ezra", ws: "以斯拉記" },
  { id: 16, en: "Nehemiah", ws: "尼希米記" },
  { id: 17, en: "Esther", ws: "以斯帖記" },
  { id: 18, en: "Job", ws: "約伯記" },
  { id: 19, en: "Psalms", ws: "詩篇" },
  { id: 20, en: "Proverbs", ws: "箴言" },
  { id: 21, en: "Ecclesiastes", ws: "傳道書" },
  { id: 22, en: "Song of Solomon", ws: "雅歌" },
  { id: 23, en: "Isaiah", ws: "以賽亞書" },
  { id: 24, en: "Jeremiah", ws: "耶利米書" },
  { id: 25, en: "Lamentations", ws: "耶利米哀歌" },
  { id: 26, en: "Ezekiel", ws: "以西結書" },
  { id: 27, en: "Daniel", ws: "但以理書" },
  { id: 28, en: "Hosea", ws: "何西阿書" },
  { id: 29, en: "Joel", ws: "約珥書" },
  { id: 30, en: "Amos", ws: "阿摩司書" },
  { id: 31, en: "Obadiah", ws: "俄巴底亞書" },
  { id: 32, en: "Jonah", ws: "約拿書" },
  { id: 33, en: "Micah", ws: "彌迦書" },
  { id: 34, en: "Nahum", ws: "那鴻書" },
  { id: 35, en: "Habakkuk", ws: "哈巴谷書" },
  { id: 36, en: "Zephaniah", ws: "西番雅書" },
  { id: 37, en: "Haggai", ws: "哈該書" },
  { id: 38, en: "Zechariah", ws: "撒迦利亞書" },
  { id: 39, en: "Malachi", ws: "瑪拉基書" },
  { id: 40, en: "Matthew", ws: "馬太福音" },
  { id: 41, en: "Mark", ws: "馬可福音" },
  { id: 42, en: "Luke", ws: "路加福音" },
  { id: 43, en: "John", ws: "約翰福音" },
  { id: 44, en: "Acts", ws: "使徒行傳" },
  { id: 45, en: "Romans", ws: "羅馬人書" },
  { id: 46, en: "1 Corinthians", ws: "哥林多前書" },
  { id: 47, en: "2 Corinthians", ws: "哥林多後書" },
  { id: 48, en: "Galatians", ws: "加拉太書" },
  { id: 49, en: "Ephesians", ws: "以弗所書" },
  { id: 50, en: "Philippians", ws: "腓立比書" },
  { id: 51, en: "Colossians", ws: "歌羅西書" },
  { id: 52, en: "1 Thessalonians", ws: "帖撒羅尼迦前書" },
  { id: 53, en: "2 Thessalonians", ws: "帖撒羅尼迦後書" },
  { id: 54, en: "1 Timothy", ws: "提摩太前書" },
  { id: 55, en: "2 Timothy", ws: "提摩太後書" },
  { id: 56, en: "Titus", ws: "提多書" },
  { id: 57, en: "Philemon", ws: "腓利門書" },
  { id: 58, en: "Hebrews", ws: "希伯來書" },
  { id: 59, en: "James", ws: "雅各書" },
  { id: 60, en: "1 Peter", ws: "彼得前書" },
  { id: 61, en: "2 Peter", ws: "彼得後書" },
  { id: 62, en: "1 John", ws: "約翰一書" },
  { id: 63, en: "2 John", ws: "約翰二書" },
  { id: 64, en: "3 John", ws: "約翰三書" },
  { id: 65, en: "Jude", ws: "猶大書" },
  { id: 66, en: "Revelation", ws: "啟示錄" },
] as const;

export type WsBookDef = (typeof WS_BOOKS)[number];

export const ZH_FONT_STORAGE_KEY = "bible-study-zh-font-v1";

export type ZhFontPreset = {
  id: string;
  label: string;
  cssStack: string;
  sheets: string[];
};

export const CHINESE_FONT_PRESETS: ZhFontPreset[] = [
  {
    id: "system-serif",
    label: "系統 Serif（本機字體）",
    cssStack: "serif",
    sheets: [],
  },
  {
    id: "system-kai",
    label: "系統楷／華康（本機字體）",
    cssStack:
      '"Kaiti TC", "Kaiti SC", "Kaiti HK", "BiauKai", "標楷體", "KaiTi", "STKaiti", "DFKai-SB", "Songti TC", serif',
    sheets: [],
  },
  {
    id: "qiji",
    label: "齊伋體 QIJI",
    cssStack: "QIJI, serif",
    sheets: [],
  },
  {
    id: "stkaiti",
    label: "華文楷體 STKaiti",
    cssStack: '"STKaiti Web", "STKaiti", "华文楷体", "Kaiti TC", "Kaiti SC", "KaiTi", "楷体", serif',
    sheets: [],
  },
  {
    id: "lxgw-wenkai",
    label: "霞鹜文楷 LXGW WenKai",
    cssStack: '"LXGW WenKai", "Kaiti TC", "KaiTi", serif',
    sheets: ["https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css"],
  },
  {
    id: "iming",
    label: "一點明體 I.Ming（傳統明體）",
    cssStack: '"I.Ming", "Noto Serif TC", "Songti TC", serif',
    sheets: ["https://cdn.jsdelivr.net/gh/ichitenfont/I.MingWebfont@master/I.Ming/I.Ming.css"],
  },
  {
    id: "noto-serif-tc",
    label: "思源宋體繁 Noto Serif TC",
    cssStack: '"Noto Serif TC", "Songti TC", "PMingLiU", serif',
    sheets: [],
  },
  {
    id: "zen-old-mincho",
    label: "Zen Old Mincho",
    cssStack: '"Zen Old Mincho", "Noto Serif TC", serif',
    sheets: [],
  },
  {
    id: "shippori-mincho",
    label: "Shippori Mincho（禮儀明朝風）",
    cssStack: '"Shippori Mincho", "Noto Serif TC", serif',
    sheets: [],
  },
  {
    id: "tai-heritage",
    label: "Tai Heritage Pro（傣／繁體混排友好）",
    cssStack: '"Tai Heritage Pro", "Noto Serif TC", serif',
    sheets: [],
  },
  {
    id: "noto-sans-tc",
    label: "思源黑體繁 Noto Sans TC",
    cssStack: '"Noto Sans TC", "Heiti TC", "PingFang TC", sans-serif',
    sheets: [],
  },
  {
    id: "klee-one",
    label: "Klee One（日文教科書體）",
    cssStack: '"Klee One", "Noto Serif TC", serif',
    sheets: [],
  },
  {
    id: "zcool-xiaowei",
    label: "站酷小薇體（標題用筆觸）",
    cssStack: '"ZCOOL XiaoWei", "Kaiti TC", serif',
    sheets: [],
  },
  {
    id: "ma-shan",
    label: "馬善政楷（行書感強）",
    cssStack: '"Ma Shan Zheng", "Kaiti TC", serif',
    sheets: [],
  },
  {
    id: "long-cang",
    label: "隆行草書體 Long Cang",
    cssStack: '"Long Cang", "Kaiti TC", serif',
    sheets: [],
  }
];

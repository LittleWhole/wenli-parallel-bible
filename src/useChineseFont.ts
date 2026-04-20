import { useCallback, useEffect, useState } from "react";
import { CHINESE_FONT_PRESETS, ZH_FONT_STORAGE_KEY, type ZhFontPreset } from "./constants";

function ensureStylesheetOnce(href: string) {
  for (const el of document.head.querySelectorAll("link[data-zh-font-sheet]")) {
    if (el.getAttribute("data-zh-font-sheet") === href) return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-zh-font-sheet", href);
  document.head.appendChild(link);
}

export function useChineseFont() {
  const [fontId, setFontId] = useState<string>(() => {
    try {
      let saved = localStorage.getItem(ZH_FONT_STORAGE_KEY) || "";
      if (saved === "kaiti-free" || saved === "microsoft-kaiti") saved = "stkaiti";
      if (CHINESE_FONT_PRESETS.some((p) => p.id === saved)) return saved;
    } catch {
      /* ignore */
    }
    return "qiji";
  });

  const applyPreset = useCallback((preset: ZhFontPreset) => {
    (preset.sheets || []).forEach((href) => ensureStylesheetOnce(href));
    document.documentElement.style.setProperty("--wy-book-font", preset.cssStack);
    try {
      localStorage.setItem(ZH_FONT_STORAGE_KEY, preset.id);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const preset = CHINESE_FONT_PRESETS.find((p) => p.id === fontId) ?? CHINESE_FONT_PRESETS[0];
    applyPreset(preset);
  }, [fontId, applyPreset]);

  return { fontId, setFontId, presets: CHINESE_FONT_PRESETS };
}

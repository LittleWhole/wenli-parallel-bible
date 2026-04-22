import { useEffect, useId, useRef } from "react";
import type { BollsTranslation } from "./bollsTranslations";
import type { ZhSource } from "./zhSource";
import { ZH_SOURCE_LABEL } from "./zhSource";
import type { ZhFontPreset } from "./constants";

type Props = {
  open: boolean;
  onClose: () => void;
  enTranslation: string;
  enTranslations: BollsTranslation[];
  onEnTranslationChange: (shortName: string) => void;
  redLetterOn: boolean;
  onRedLetterToggle: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  zhSource: ZhSource;
  onZhSourceChange: (s: ZhSource) => void;
  fontId: string;
  presets: ZhFontPreset[];
  onFontIdChange: (id: string) => void;
  loading: boolean;
  onReload: () => void;
  onOpenSources: () => void;
};

export function MoreMenuDialog({
  open,
  onClose,
  enTranslation,
  enTranslations,
  onEnTranslationChange,
  redLetterOn,
  onRedLetterToggle,
  darkMode,
  onDarkModeToggle,
  zhSource,
  onZhSourceChange,
  fontId,
  presets,
  onFontIdChange,
  loading,
  onReload,
  onOpenSources,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  return (
    <dialog
      id="more-menu-dialog"
      ref={ref}
      className="more-menu-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <div className="more-menu-dialog__box">
        <h2 id={titleId} className="more-menu-dialog__title">
          Settings
        </h2>
        <div className="more-menu-dialog__body">
          <div className="more-menu-field">
            <label htmlFor="more-en-translation">English translation</label>
            <select
              id="more-en-translation"
              className="select-compact more-menu-select"
              aria-label="English Bible translation"
              value={enTranslation}
              disabled={enTranslations.length === 0}
              onChange={(e) => onEnTranslationChange(e.target.value)}
            >
              {enTranslations.length === 0 ? (
                <option value={enTranslation}>{enTranslation}</option>
              ) : (
                enTranslations.map((t) => (
                  <option key={t.short_name} value={t.short_name} title={t.full_name}>
                    {t.short_name} — {t.full_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="more-menu-field">
            <label htmlFor="more-zh-source">CJK source</label>
            <select
              id="more-zh-source"
              className="select-compact more-menu-select"
              aria-label="Parallel column Bible text"
              value={zhSource}
              onChange={(e) => onZhSourceChange(e.target.value as ZhSource)}
            >
              <option value="wenli">{ZH_SOURCE_LABEL.wenli}</option>
              <option value="koreanHan">{ZH_SOURCE_LABEL.koreanHan}</option>
              <option value="meiji">{ZH_SOURCE_LABEL.meiji}</option>
            </select>
          </div>

          <div className="more-menu-field">
            <label htmlFor="more-zh-font">CJK font</label>
            <select
              id="more-zh-font"
              className="select-compact more-menu-select"
              aria-label="Chinese column font"
              value={fontId}
              onChange={(e) => onFontIdChange(e.target.value)}
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="more-menu-actions-row">
            <button
              type="button"
              className={`btn-toggle more-menu-toggle${redLetterOn ? " is-on" : ""}`}
              aria-pressed={redLetterOn}
              onClick={onRedLetterToggle}
            >
              Red letter
            </button>
            <button
              type="button"
              className={`btn-theme more-menu-toggle${darkMode ? " is-dark" : ""}`}
              aria-pressed={darkMode}
              onClick={onDarkModeToggle}
            >
              <span className="btn-theme-icon" aria-hidden>
                {darkMode ? "☀" : "☽"}
              </span>
              <span className="btn-theme-text">{darkMode ? "Light" : "Dark"}</span>
            </button>
          </div>

          <div className="more-menu-field more-menu-field--buttons">
            <button
              type="button"
              className="btn-refresh more-menu-btn-full"
              onClick={onReload}
              disabled={loading}
            >
              Reload passage
            </button>
            <button type="button" className="btn-sources-outline more-menu-btn-full" onClick={onOpenSources}>
              Sources &amp; attribution
            </button>
          </div>
        </div>
        <form method="dialog" className="more-menu-dialog__footer">
          <button type="submit" className="btn-sources-close">
            Done
          </button>
        </form>
      </div>
    </dialog>
  );
}

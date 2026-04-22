import { useRef, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Single place listing where parallel text and metadata come from (URLs and work titles).
 */
export function SourcesDialog({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

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
    <dialog ref={ref} className="sources-dialog" onClose={onClose}>
      <div className="sources-dialog__box">
        <h2 className="sources-dialog__title">Sources</h2>
        <div className="sources-dialog__body">
          <section>
            <h3>English column</h3>
            <p>
              Text and verse boundaries are loaded from the{" "}
              <a href="https://bolls.life/" target="_blank" rel="noopener noreferrer">
                Bolls
              </a>{" "}
              public API. Red-letter (words of Jesus) uses in-app verse lists keyed by translation.
            </p>
          </section>
          <section>
            <h3>CJK column</h3>
            <p>Choose one source in the toolbar. Each loads chapter text from the provider below.</p>
            <ul>
              <li>
                <strong>文理和合</strong> —{" "}
                <a
                  href="https://zh.wikisource.org/wiki/%E8%81%96%E7%B6%93_(%E6%96%87%E7%90%86%E5%92%8C%E5%90%88)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chinese Wikisource
                </a>
                , 《聖經 (文理和合)》 (Wenli Union), MediaWiki wikitext.
              </li>
              <li>
                <strong>國漢文</strong> —{" "}
                <a href="https://wiki.michaelhan.net/%EA%B5%AD%ED%95%9C%EB%AC%B8%EC%84%B1%EA%B2%BD" target="_blank" rel="noopener noreferrer">
                  Han Wiki — 국한문성경
                </a>
                , via MediaWiki REST page source.
              </li>
              <li>
                <strong>明治元譯</strong> —{" "}
                <a href="https://ja.wikisource.org/" target="_blank" rel="noopener noreferrer">
                  Japanese Wikisource
                </a>
                : Old Testament from 明治元譯舊約聖書 (文語訳 / ruby volumes as implemented); New Testament from
                明治元譯新約聖書（大正4年） (Taisho 4 edition), multiple concatenated pages per book where applicable.
              </li>
            </ul>
          </section>
        </div>
        <form method="dialog" className="sources-dialog__footer">
          <button type="submit" className="btn-sources-close">
            Close
          </button>
        </form>
      </div>
    </dialog>
  );
}

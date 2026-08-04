import type { LensPhoto, Verdict } from "../../lib/types";

export type CullLoupeProps = {
  photo: LensPhoto;
  /** Position in visible list (1-based display). */
  index: number;
  total: number;
  stackSize: number;
  onClose: () => void;
  onVerdict: (id: string, v: Verdict) => void;
};

const VERDICT_LABEL: Record<Verdict, string> = {
  keep: "Keep",
  reject: "Reject",
  flag: "Flag",
  unset: "Open",
};

/**
 * Full-frame review (loupe). Keyboard still owned by useCullKeyboard.
 * Click backdrop or Close to exit; Z / Esc also close.
 */
export function CullLoupe({
  photo,
  index,
  total,
  stackSize,
  onClose,
  onVerdict,
}: CullLoupeProps) {
  return (
    <div
      className="loupe"
      role="dialog"
      aria-modal="true"
      aria-label={`Review ${photo.name}`}
    >
      <button
        type="button"
        className="loupe-backdrop"
        aria-label="Close loupe"
        onClick={onClose}
      />
      <div className="loupe-stage">
        {photo.previewOk && photo.url ? (
          <img
            src={photo.url}
            alt={photo.name}
            className="loupe-img"
            draggable={false}
          />
        ) : (
          <div className="loupe-fail">
            <p>No preview for {photo.name}</p>
            <p className="loupe-fail-sub">
              {photo.format === "raw"
                ? "RAW files need Lightroom for pixels. Mark keep/reject by name, then Open in Adobe."
                : "This browser couldn’t decode the file."}
            </p>
          </div>
        )}
      </div>
      <div className="loupe-bar">
        <div className="loupe-meta">
          <strong>{photo.name}</strong>
          <span>
            {index + 1}/{total}
            {stackSize > 1 ? ` · stack ×${stackSize}` : ""}
            {" · "}
            {photo.previewOk && photo.score != null
              ? `score ${Math.round(photo.score * 100)}`
              : "unscored"}
            {photo.soft ? " · soft" : ""}
            {" · "}
            <span className={`loupe-verdict v-${photo.verdict}`}>
              {VERDICT_LABEL[photo.verdict]}
            </span>
          </span>
        </div>
        <div className="loupe-actions">
          <button
            type="button"
            className="btn btn-keep"
            onClick={() => onVerdict(photo.id, "keep")}
            title="K"
          >
            Keep
          </button>
          <button
            type="button"
            className="btn btn-reject"
            onClick={() => onVerdict(photo.id, "reject")}
            title="R"
          >
            Reject
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onVerdict(photo.id, "flag")}
            title="F"
          >
            Flag
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => onVerdict(photo.id, "unset")}
            title="X"
          >
            Unset
          </button>
          <button type="button" className="btn" onClick={onClose} title="Esc">
            Close
          </button>
        </div>
        <p className="loupe-hint">
          <kbd>K</kbd>
          <kbd>R</kbd>
          <kbd>F</kbd>
          <kbd>X</kbd> · <kbd>←→</kbd> · <kbd>Z</kbd>/<kbd>Esc</kbd> exit ·
          auto-advances
        </p>
      </div>
    </div>
  );
}

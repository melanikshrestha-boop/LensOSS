import { useEffect, useMemo, useState } from "react";
import type { LensPhoto, Verdict } from "../../lib/types";

export type StackCompareProps = {
  /** Stack mates score-desc (len ≥ 2). */
  mates: LensPhoto[];
  /** Currently focused frame (left pane). */
  leftId: string;
  onSelect: (id: string) => void;
  onVerdict: (id: string, v: Verdict) => void;
  onClose: () => void;
};

function pane(photo: LensPhoto, side: "L" | "R", active: boolean) {
  return (
    <div className={`stack-compare-pane ${active ? "active" : ""}`}>
      <div className="stack-compare-label">
        <span>{side === "L" ? "1 · Left" : "2 · Right"}</span>
        <strong>{photo.name}</strong>
        <span>
          {photo.score != null ? `score ${Math.round(photo.score * 100)}` : "—"}
          {photo.soft ? " · soft" : ""}
          {` · ${photo.verdict}`}
        </span>
      </div>
      <div className="stack-compare-frame">
        {photo.previewOk && photo.url ? (
          <img src={photo.url} alt={photo.name} draggable={false} />
        ) : (
          <div className="stack-compare-fail">No preview</div>
        )}
      </div>
    </div>
  );
}

/**
 * 2-up stack compare — side-by-side near-dupes.
 * Keys: Esc close · [ ] cycle right · 1 win left · 2 win right · C close
 */
export function StackCompare({
  mates,
  leftId,
  onSelect,
  onVerdict,
  onClose,
}: StackCompareProps) {
  const left = useMemo(
    () => mates.find((m) => m.id === leftId) ?? mates[0],
    [mates, leftId]
  );

  const rightCandidates = useMemo(
    () => mates.filter((m) => m.id !== left.id),
    [mates, left.id]
  );

  const [rightIdx, setRightIdx] = useState(0);
  const right =
    rightCandidates[
      Math.max(0, Math.min(rightIdx, rightCandidates.length - 1))
    ] ?? rightCandidates[0];

  // Keep right index valid when left changes
  useEffect(() => {
    setRightIdx(0);
  }, [left.id]);

  const win = (winnerId: string) => {
    for (const m of mates) {
      if (m.id === winnerId) onVerdict(m.id, "keep");
      else if (m.verdict !== "flag") onVerdict(m.id, "reject");
    }
    onSelect(winnerId);
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;

      if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "]" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        setRightIdx((i) => (i + 1) % Math.max(1, rightCandidates.length));
        return;
      }
      if (e.key === "[" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        setRightIdx(
          (i) =>
            (i - 1 + Math.max(1, rightCandidates.length)) %
            Math.max(1, rightCandidates.length)
        );
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        e.stopPropagation();
        win(left.id);
        return;
      }
      if (e.key === "2" && right) {
        e.preventDefault();
        e.stopPropagation();
        win(right.id);
      }
    };
    // Capture so we win over grid keyboard while compare is open
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [left.id, right, rightCandidates.length, mates, onClose, onSelect, onVerdict]);

  if (!left || !right) return null;

  return (
    <div
      className="stack-compare"
      role="dialog"
      aria-modal="true"
      aria-label="Compare stack"
    >
      <button
        type="button"
        className="stack-compare-backdrop"
        aria-label="Close compare"
        onClick={onClose}
      />
      <div className="stack-compare-shell">
        <header className="stack-compare-head">
          <strong>Compare · stack ×{mates.length}</strong>
          <span>
            <kbd>1</kbd> win left · <kbd>2</kbd> win right · <kbd>[ ]</kbd> swap
            right · <kbd>C</kbd>/<kbd>Esc</kbd> close
          </span>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="stack-compare-row">
          <button
            type="button"
            className="stack-compare-side"
            onClick={() => win(left.id)}
            title="Win left (1)"
          >
            {pane(left, "L", true)}
          </button>
          <button
            type="button"
            className="stack-compare-side"
            onClick={() => win(right.id)}
            title="Win right (2)"
          >
            {pane(right, "R", false)}
          </button>
        </div>
      </div>
    </div>
  );
}

import type { LensPhoto, Verdict } from "../../lib/types";

export type StackStripProps = {
  /** All frames in the selected stack, score-desc preferred. */
  mates: LensPhoto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onVerdict: (id: string, v: Verdict) => void;
  /** Open 2-up compare (C). */
  onCompare?: () => void;
};

/**
 * Near-dupe stack strip — pick the winner without leaving the grid flow.
 * Only render when mates.length > 1.
 */
export function StackStrip({
  mates,
  selectedId,
  onSelect,
  onVerdict,
  onCompare,
}: StackStripProps) {
  if (mates.length < 2) return null;

  const bestId = mates.reduce((a, b) => {
    const sa = a.score ?? -1;
    const sb = b.score ?? -1;
    return sa >= sb ? a : b;
  }).id;

  return (
    <div className="stack-strip" role="region" aria-label="Near-dupe stack">
      <div className="stack-strip-head">
        <strong>Stack · {mates.length} near-dupes</strong>
        <span>Pick one winner — others usually reject</span>
        {onCompare ? (
          <button
            type="button"
            className="btn btn-sm stack-compare-btn"
            onClick={onCompare}
            title="Compare 2-up (C)"
          >
            Compare · C
          </button>
        ) : null}
      </div>
      <div className="stack-strip-row">
        {mates.map((p, i) => {
          const selected = p.id === selectedId;
          const isBest = p.id === bestId;
          return (
            <button
              key={p.id}
              type="button"
              className={[
                "stack-thumb",
                p.verdict,
                selected ? "selected" : "",
                isBest ? "best" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(p.id)}
              title={`${p.name} · ${p.score != null ? Math.round(p.score * 100) : "—"}`}
            >
              {p.previewOk && p.url ? (
                <img src={p.url} alt="" draggable={false} />
              ) : (
                <div className="stack-thumb-fail">?</div>
              )}
              <span className="stack-thumb-meta">
                #{i + 1} · {p.score != null ? Math.round(p.score * 100) : "—"}
                {isBest ? " · top" : ""}
                {p.soft ? " · soft" : ""}
              </span>
              <span className="stack-thumb-actions">
                <span
                  role="button"
                  tabIndex={0}
                  className="stack-pick"
                  title="Keep this, reject rest of stack"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Winner keep; stack mates reject (unless already flagged)
                    for (const m of mates) {
                      if (m.id === p.id) onVerdict(m.id, "keep");
                      else if (m.verdict !== "flag") onVerdict(m.id, "reject");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      for (const m of mates) {
                        if (m.id === p.id) onVerdict(m.id, "keep");
                        else if (m.verdict !== "flag")
                          onVerdict(m.id, "reject");
                      }
                    }
                  }}
                >
                  Win
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import type { LensPhoto, Verdict } from "../../lib/types";

export type CullGridProps = {
  photos: LensPhoto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onVerdict: (id: string, v: Verdict) => void;
  stackHighlightId?: string | null;
  stackSizes?: Map<string, number>;
  onOpenLoupe?: (id: string) => void;
};

function scoreLabel(p: LensPhoto): string {
  if (!p.previewOk || p.score == null) return "—";
  return String(Math.round(p.score * 100));
}

/**
 * Dense cull grid — real thumbs, honest scores, fail state when decode died.
 */
export function CullGrid({
  photos,
  selectedId,
  onSelect,
  onVerdict,
  stackHighlightId,
  stackSizes,
  onOpenLoupe,
}: CullGridProps) {
  const selectedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
  }, [selectedId]);

  if (!photos.length) {
    return (
      <p className="cull-empty">
        No photos match this filter. Import a folder or change chips above.
      </p>
    );
  }

  return (
    <div className="grid cull-grid" role="list" aria-label="Cull grid">
      {photos.map((p) => {
        const selected = p.id === selectedId;
        const inStack =
          stackHighlightId != null &&
          p.stackId === stackHighlightId &&
          p.id !== selectedId;
        const stackN = stackSizes?.get(p.stackId) ?? 1;
        const className = [
          "card",
          p.verdict,
          selected ? "selected" : "",
          inStack ? "stack-mate" : "",
          p.soft ? "soft" : "",
          !p.previewOk ? "no-preview" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={p.id}
            ref={selected ? selectedRef : undefined}
            role="listitem"
            className={className}
            data-id={p.id}
            data-selected={selected ? "true" : undefined}
            tabIndex={0}
            onClick={() => onSelect(p.id)}
            onDoubleClick={() => {
              onSelect(p.id);
              if (p.previewOk) onOpenLoupe?.(p.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSelect(p.id);
                if (p.previewOk) onOpenLoupe?.(p.id);
              }
            }}
          >
            {p.previewOk && p.url ? (
              <img
                src={p.url}
                alt={p.name}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <div className="card-fail" title={p.name}>
                <span>No preview</span>
                <small>
                  {p.format === "raw"
                    ? "RAW — pick by name or open in LR"
                    : p.format === "heic"
                      ? "HEIC not supported here"
                      : "Couldn’t decode"}
                </small>
              </div>
            )}
            {stackN > 1 ? (
              <span className="stack-badge" title={`${stackN} near-dupes`}>
                ×{stackN}
              </span>
            ) : null}
            <div className="actions">
              <button
                type="button"
                title="Keep (K)"
                aria-label={`Keep ${p.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onVerdict(p.id, "keep");
                }}
              >
                ✓
              </button>
              <button
                type="button"
                title="Reject (R)"
                aria-label={`Reject ${p.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onVerdict(p.id, "reject");
                }}
              >
                ✕
              </button>
              <button
                type="button"
                title="Flag (F)"
                aria-label={`Flag ${p.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onVerdict(p.id, "flag");
                }}
              >
                ★
              </button>
            </div>
            <div className="meta">
              <span title={p.previewOk ? "Technical score 0–100" : "Unscored"}>
                {scoreLabel(p)}
              </span>
              <span
                title={
                  !p.previewOk
                    ? "No preview"
                    : p.soft
                      ? "Soft / blur proxy"
                      : "Technically OK"
                }
              >
                {!p.previewOk
                  ? p.format
                  : p.soft
                    ? "soft"
                    : p.verdict === "unset"
                      ? "·"
                      : p.verdict[0]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

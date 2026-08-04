import type { ReactNode } from "react";

export type CullFilter =
  | "all"
  | "keep"
  | "reject"
  | "unset"
  | "flag"
  | "stacks";

export type CullStats = {
  n: number;
  k: number;
  r: number;
  u: number;
  f?: number;
  stacks: number;
};

export type CullToolbarProps = {
  stats: CullStats;
  filter: CullFilter;
  onFilterChange: (f: CullFilter) => void;
  onAutoPick: () => void;
  /** Extra actions (Adobe / client) — parent owns product flow */
  extraActions?: ReactNode;
  busy?: boolean;
  autoAdvance?: boolean;
  onAutoAdvanceChange?: (on: boolean) => void;
  onOpenLoupe?: () => void;
};

const FILTERS: { id: CullFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unset", label: "Open" },
  { id: "keep", label: "Keep" },
  { id: "flag", label: "Flag" },
  { id: "reject", label: "Reject" },
  { id: "stacks", label: "Stacks" },
];

/**
 * Cull toolbar: auto-pick, auto-advance, loupe, filters, stats.
 */
export function CullToolbar({
  stats,
  filter,
  onFilterChange,
  onAutoPick,
  extraActions,
  busy = false,
  autoAdvance = true,
  onAutoAdvanceChange,
  onOpenLoupe,
}: CullToolbarProps) {
  const decided = stats.k + stats.r + (stats.f ?? 0);
  const pct = stats.n ? Math.round((decided / stats.n) * 100) : 0;

  return (
    <div className="toolbar cull-toolbar">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy || stats.n === 0}
        onClick={onAutoPick}
        title="Score thresholds + stack winners"
      >
        Auto-pick
      </button>

      {onOpenLoupe ? (
        <button
          type="button"
          className="btn"
          disabled={stats.n === 0}
          onClick={onOpenLoupe}
          title="Z or Enter"
        >
          Loupe
        </button>
      ) : null}

      {onAutoAdvanceChange ? (
        <button
          type="button"
          className={autoAdvance ? "btn btn-accent" : "btn"}
          aria-pressed={autoAdvance}
          onClick={() => onAutoAdvanceChange(!autoAdvance)}
          title="After K/R/F jump to next frame"
        >
          Auto-advance {autoAdvance ? "on" : "off"}
        </button>
      ) : null}

      {extraActions}

      <div className="cull-filters" role="group" aria-label="Filter photos">
        {FILTERS.map(({ id, label }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              className={active ? "btn btn-accent" : "btn"}
              aria-pressed={active}
              onClick={() => onFilterChange(id)}
            >
              {label}
              {id === "unset" && stats.u > 0 ? ` ${stats.u}` : ""}
              {id === "keep" && stats.k > 0 ? ` ${stats.k}` : ""}
              {id === "flag" && (stats.f ?? 0) > 0 ? ` ${stats.f}` : ""}
            </button>
          );
        })}
      </div>

      <div className="stats">
        <span className="cull-progress-inline">
          {pct}% decided
        </span>
        {" · "}
        {stats.n} photos · {stats.stacks} stacks ·{" "}
        <strong>{stats.k} keep</strong> · {stats.r} reject · {stats.u} open
        {typeof stats.f === "number" && stats.f > 0 ? ` · ${stats.f} flag` : null}
      </div>
    </div>
  );
}

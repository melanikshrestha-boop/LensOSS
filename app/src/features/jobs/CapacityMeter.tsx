type Props = {
  year: number;
  jobCount: number;
  capacity: number;
  onCapacityChange?: (n: number) => void;
};

/**
 * Visual for wedding/event shooters aiming at 20–40 jobs/year
 * with predictable load (not surprise burnout).
 */
export function CapacityMeter({
  year,
  jobCount,
  capacity,
  onCapacityChange,
}: Props) {
  const pct = Math.min(100, Math.round((jobCount / Math.max(1, capacity)) * 100));
  const remaining = Math.max(0, capacity - jobCount);

  return (
    <div className="capacity-meter">
      <div className="capacity-head">
        <strong>
          {year} capacity · {jobCount}/{capacity} jobs
        </strong>
        <span className="capacity-remain">
          {remaining === 0 ? "Full year" : `${remaining} open slots`}
        </span>
      </div>
      <div
        className="capacity-bar"
        role="progressbar"
        aria-valuenow={jobCount}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`${jobCount} of ${capacity} jobs in ${year}`}
      >
        <div className="capacity-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="capacity-note">
        Built for 20–40+ weddings/events a year — maximum time savings, one
        predictable stack (Lens + Adobe), not six subscriptions.
      </p>
      {onCapacityChange ? (
        <label className="capacity-set">
          Annual target
          <input
            type="number"
            min={1}
            max={200}
            value={capacity}
            onChange={(e) => onCapacityChange(Number(e.target.value) || 40)}
          />
        </label>
      ) : null}
    </div>
  );
}

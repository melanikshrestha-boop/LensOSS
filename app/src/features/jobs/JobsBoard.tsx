import type { ShootJob } from "../../lib/types";
import { JOB_STATUS_LABELS, JOB_TYPE_LABELS } from "../../lib/types";
import { CapacityMeter } from "./CapacityMeter";
import { NewJobForm, type NewJobFormValues } from "./NewJobForm";

type Props = {
  jobs: ShootJob[];
  activeJobId: string | null;
  year: number;
  capacity: number;
  busy?: boolean;
  onCapacityChange: (n: number) => void;
  onCreate: (values: NewJobFormValues) => void | Promise<void>;
  onSelect: (job: ShootJob) => void;
  onOpenActive: () => void;
  onDelete: (id: string) => void;
};

export function JobsBoard({
  jobs,
  activeJobId,
  year,
  capacity,
  busy,
  onCapacityChange,
  onCreate,
  onSelect,
  onOpenActive,
  onDelete,
}: Props) {
  const yearJobs = jobs.filter((j) => j.year === year);
  const active = jobs.find((j) => j.id === activeJobId) || null;

  return (
    <section className="jobs-board">
      <header className="jobs-hero">
        <h1>Jobs</h1>
        <p>
          Wedding & event volume: track every shoot, keep Lightroom looks
          consistent, deliver without a second gallery subscription.
        </p>
      </header>

      <CapacityMeter
        year={year}
        jobCount={yearJobs.length}
        capacity={capacity}
        onCapacityChange={onCapacityChange}
      />

      {active ? (
        <div className="active-job-banner">
          <div>
            <strong>Active: {active.name}</strong>
            <span>
              {" "}
              · {JOB_TYPE_LABELS[active.type]} · {JOB_STATUS_LABELS[active.status]}
              {active.lrPreset ? ` · LR: ${active.lrPreset}` : ""}
            </span>
          </div>
          <button type="button" className="btn btn-primary" onClick={onOpenActive}>
            Continue job →
          </button>
        </div>
      ) : null}

      <div className="jobs-layout">
        <NewJobForm onCreate={onCreate} busy={busy} />

        <div className="jobs-list">
          <h3 className="job-form-title">{year} pipeline</h3>
          {!yearJobs.length ? (
            <p className="jobs-empty">
              No jobs yet. Add a wedding or event — then import that shoot’s
              folder.
            </p>
          ) : (
            <ul className="jobs-ul">
              {yearJobs.map((j) => {
                const isActive = j.id === activeJobId;
                return (
                  <li
                    key={j.id}
                    className={`job-row${isActive ? " active" : ""}`}
                  >
                    <button
                      type="button"
                      className="job-row-main"
                      onClick={() => onSelect(j)}
                    >
                      <span className="job-name">{j.name}</span>
                      <span className="job-meta">
                        {JOB_TYPE_LABELS[j.type]}
                        {j.eventDate ? ` · ${j.eventDate}` : ""}
                        {j.clientName ? ` · ${j.clientName}` : ""}
                      </span>
                      <span className={`job-status status-${j.status}`}>
                        {JOB_STATUS_LABELS[j.status]}
                      </span>
                      <span className="job-counts">
                        {j.photoCount
                          ? `${j.keeperCount}/${j.photoCount} keepers`
                          : "Awaiting import"}
                        {j.minutesSavedEstimate
                          ? ` · ~${j.minutesSavedEstimate}m saved`
                          : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn job-delete"
                      title="Remove job"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove “${j.name}” from the pipeline? Photos in this session are not deleted.`
                          )
                        ) {
                          onDelete(j.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

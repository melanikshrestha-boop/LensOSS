import { useState, type FormEvent } from "react";
import type { JobType } from "../../lib/types";
import { JOB_TYPE_LABELS } from "../../lib/types";

export type NewJobFormValues = {
  name: string;
  clientName: string;
  type: JobType;
  eventDate: string;
  lrPreset: string;
  editBrief: string;
};

type Props = {
  onCreate: (values: NewJobFormValues) => void | Promise<void>;
  busy?: boolean;
};

const TYPES = Object.keys(JOB_TYPE_LABELS) as JobType[];

/**
 * Book the next wedding/event into the year pipeline.
 * Captures LR preset early so edit consistency starts at job creation.
 */
export function NewJobForm({ onCreate, busy }: Props) {
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [type, setType] = useState<JobType>("wedding");
  const [eventDate, setEventDate] = useState("");
  const [lrPreset, setLrPreset] = useState("");
  const [editBrief, setEditBrief] = useState(
    "Same skin, contrast, and white-balance family across the full set."
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    void Promise.resolve(
      onCreate({
        name: name.trim(),
        clientName: clientName.trim(),
        type,
        eventDate,
        lrPreset: lrPreset.trim(),
        editBrief: editBrief.trim(),
      })
    ).then(() => {
      setName("");
      setClientName("");
      setEventDate("");
      // Keep preset/brief — volume shooters re-use look year-round
    });
  };

  return (
    <form className="gallery-form job-form" onSubmit={submit}>
      <h3 className="job-form-title">New job</h3>
      <label>
        Shoot name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Maya & Jordan — Rosewood"
          required
          disabled={busy}
        />
      </label>
      <label>
        Client
        <input
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Couple or planner name"
          disabled={busy}
        />
      </label>
      <div className="job-form-row">
        <label>
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value as JobType)}
            disabled={busy}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {JOB_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Event date
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            disabled={busy}
          />
        </label>
      </div>
      <label>
        Lightroom preset / look (consistency)
        <input
          value={lrPreset}
          onChange={(e) => setLrPreset(e.target.value)}
          placeholder="e.g. Warm Film v3 — apply to all selects first"
          disabled={busy}
        />
      </label>
      <label>
        Edit brief (quality bar)
        <textarea
          rows={2}
          value={editBrief}
          onChange={(e) => setEditBrief(e.target.value)}
          disabled={busy}
        />
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy || !name.trim()}>
        Add to year pipeline
      </button>
    </form>
  );
}

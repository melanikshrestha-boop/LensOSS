import type { ShootJob } from "../../lib/types";
import { AdobeHintBox, AdobeHandoffButton } from "../adobe";

type AdobeHint = { title: string; steps: string[] };

type Props = {
  job: ShootJob | null;
  keeperCount: number;
  busy: boolean;
  adobeHint: AdobeHint | null;
  lrPreset: string;
  editBrief: string;
  onLrPresetChange: (v: string) => void;
  onEditBriefChange: (v: string) => void;
  onSaveBrief: () => void;
  onHandoffAdobe: () => void;
  onExportSelects: () => void;
  onMarkEditDone: () => void;
  onGoSend: () => void;
};

/**
 * LR-first phase: bottleneck is consistent high-quality editing.
 * Cull is done; craft lives in Lightroom; Lens holds the brief + selects package.
 */
export function EditPhase({
  job,
  keeperCount,
  busy,
  adobeHint,
  lrPreset,
  editBrief,
  onLrPresetChange,
  onEditBriefChange,
  onSaveBrief,
  onHandoffAdobe,
  onExportSelects,
  onMarkEditDone,
  onGoSend,
}: Props) {
  return (
    <section className="edit-phase">
      <h2 style={{ marginTop: 0 }}>Edit in Lightroom</h2>
      <p style={{ color: "var(--soft)", maxWidth: "40rem" }}>
        Your bottleneck is{" "}
        <strong>consistent, high-quality editing</strong> — not selection
        volume. Keep the same develop look across every wedding this year.
        Lens packs selects; Lightroom does the craft.
      </p>

      {job ? (
        <p className="edit-job-line">
          <strong>{job.name}</strong>
          {job.eventDate ? ` · ${job.eventDate}` : ""}
          {" · "}
          {keeperCount} keepers
          {job.adobeExportedAt
            ? ` · exported ${new Date(job.adobeExportedAt).toLocaleString()}`
            : ""}
        </p>
      ) : (
        <p className="status">
          No active job — still works, but set a job to lock your LR preset for
          the year.
        </p>
      )}

      <div className="edit-brief-card">
        <label>
          Lightroom preset / look (apply to all selects first)
          <input
            value={lrPreset}
            onChange={(e) => onLrPresetChange(e.target.value)}
            placeholder="Warm Film v3"
          />
        </label>
        <label>
          Consistency brief
          <textarea
            rows={3}
            value={editBrief}
            onChange={(e) => onEditBriefChange(e.target.value)}
            placeholder="Same skin tone family, soft contrast, no teal shadows…"
          />
        </label>
        <button type="button" className="btn" onClick={onSaveBrief}>
          Save look to job
        </button>
      </div>

      <div className="toolbar" style={{ marginTop: "1rem" }}>
        <AdobeHandoffButton
          count={keeperCount}
          loading={busy}
          className="btn btn-accent"
          onClick={onHandoffAdobe}
        />
        <button
          type="button"
          className="btn"
          disabled={!keeperCount}
          onClick={onExportSelects}
          title="CSV of keeper filenames + printed edit brief"
        >
          Export selects + brief
        </button>
        <button
          type="button"
          className="btn"
          disabled={!keeperCount}
          onClick={onMarkEditDone}
        >
          Mark edits done
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={!keeperCount}
          onClick={onGoSend}
        >
          Send to client →
        </button>
      </div>

      <ol className="edit-checklist">
        <li>Open keepers ZIP in Lightroom Classic or Lightroom cloud</li>
        <li>Apply your year preset to the full select set first</li>
        <li>Sync settings within similar lighting (ceremony / reception / details)</li>
        <li>Spot-check 5 random frames for skin, whites, blacks</li>
        <li>Come back → Send client gallery from Lens</li>
      </ol>

      {adobeHint ? <AdobeHintBox hint={adobeHint} /> : null}
    </section>
  );
}

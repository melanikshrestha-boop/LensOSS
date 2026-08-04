/**
 * Lightroom-first exports for photographers whose bottleneck is
 * consistent high-quality editing (not just selection volume).
 *
 * V1: selection list + edit brief text that travel with the keepers ZIP.
 * Deep XMP develop sync is not V1 — we stay honest about living *in* LR.
 */

import { saveAs } from "file-saver";
import type { LensPhoto, ShootJob } from "./types";
import { keepers } from "./cullEngine";

/** CSV of keepers — import as text or use filenames to build a smart collection. */
export function buildSelectsCsv(
  photos: LensPhoto[],
  job?: ShootJob | null
): string {
  const list = keepers(photos);
  const lines = [
    "filename,verdict,score,soft,job,lr_preset",
    ...list.map((p) => {
      const cells = [
        csvEscape(p.name),
        p.verdict,
        p.score != null ? p.score.toFixed(3) : "",
        p.soft ? "1" : "0",
        csvEscape(job?.name || ""),
        csvEscape(job?.lrPreset || ""),
      ];
      return cells.join(",");
    }),
  ];
  return lines.join("\n");
}

/** Plain filename list — easiest to paste into LR filters / Finder. */
export function buildSelectsTxt(photos: LensPhoto[]): string {
  return keepers(photos)
    .map((p) => p.name)
    .join("\n");
}

/**
 * Edit brief for consistent quality across many jobs/year.
 * Print next to the monitor while developing in Lightroom.
 */
export function buildEditBrief(job: ShootJob | null, keeperCount: number): string {
  const lines = [
    "LENS → LIGHTROOM EDIT BRIEF",
    "==========================",
    "",
    `Job: ${job?.name || "Untitled"}`,
    `Client: ${job?.clientName || "—"}`,
    `Type: ${job?.type || "—"}`,
    `Event date: ${job?.eventDate || "—"}`,
    `Keepers: ${keeperCount}`,
    "",
    "LOOK / PRESET (apply to all selects first)",
    job?.lrPreset?.trim() || "(set a preset name in Lens Jobs — e.g. Warm Film v3)",
    "",
    "CONSISTENCY GOAL",
    job?.editBrief?.trim() ||
      "Same skin tone, same contrast, same white balance family across the full set.",
    "",
    "CHECKLIST (volume wedding/event)",
    "[ ] Global preset on all keepers",
    "[ ] Sync settings across similar lighting scenes",
    "[ ] Spot-check skin / whites / blacks on 5 random frames",
    "[ ] Export finals → back to Lens → Send client gallery",
    "",
    "Lens owns cull + client delivery. Lightroom owns craft.",
    "Predictable stack: Lens + Adobe Photo plan — not cull + gallery + retouch SaaS stack.",
  ];
  return lines.join("\n");
}

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadTextFile(filename: string, body: string, mime = "text/plain"): void {
  const blob = new Blob([body], { type: `${mime};charset=utf-8` });
  saveAs(blob, filename);
}

/** Download selects CSV + edit brief for the open job. */
export function exportLrSelectPackage(
  photos: LensPhoto[],
  job: ShootJob | null
): { csv: boolean; brief: boolean; keeperCount: number } {
  const list = keepers(photos);
  if (!list.length) {
    return { csv: false, brief: false, keeperCount: 0 };
  }
  const slug = (job?.name || "lens")
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  downloadTextFile(
    `Lens-Selects-${slug}.csv`,
    buildSelectsCsv(photos, job),
    "text/csv"
  );
  downloadTextFile(
    `Lens-Edit-Brief-${slug}.txt`,
    buildEditBrief(job, list.length)
  );
  return { csv: true, brief: true, keeperCount: list.length };
}

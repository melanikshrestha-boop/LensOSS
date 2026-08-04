import { get, set } from "idb-keyval";
import type { JobStatus, JobType, ShootJob } from "./types";
import { DEFAULT_YEAR_CAPACITY } from "./types";

const JOBS_KEY = "lens-jobs-v1";
const CAPACITY_KEY = "lens-year-capacity-v1";

export function newJobId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export async function listJobs(): Promise<ShootJob[]> {
  const all = (await get<ShootJob[]>(JOBS_KEY)) || [];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getJob(id: string): Promise<ShootJob | null> {
  const all = await listJobs();
  return all.find((j) => j.id === id) || null;
}

export async function saveJob(job: ShootJob): Promise<void> {
  const all = (await get<ShootJob[]>(JOBS_KEY)) || [];
  const next = [job, ...all.filter((j) => j.id !== job.id)].slice(0, 200);
  await set(JOBS_KEY, next);
}

export async function deleteJob(id: string): Promise<void> {
  const all = (await get<ShootJob[]>(JOBS_KEY)) || [];
  await set(
    JOBS_KEY,
    all.filter((j) => j.id !== id)
  );
}

export async function patchJob(
  id: string,
  patch: Partial<ShootJob>
): Promise<ShootJob | null> {
  const job = await getJob(id);
  if (!job) return null;
  const next: ShootJob = {
    ...job,
    ...patch,
    id: job.id,
    updatedAt: Date.now(),
  };
  await saveJob(next);
  return next;
}

export type NewJobInput = {
  name: string;
  clientName?: string;
  type?: JobType;
  eventDate?: string;
  lrPreset?: string;
  editBrief?: string;
  year?: number;
};

export function createJobDraft(input: NewJobInput): ShootJob {
  const now = Date.now();
  const year = input.year ?? new Date().getFullYear();
  return {
    id: newJobId(),
    name: input.name.trim() || "Untitled shoot",
    clientName: (input.clientName || "").trim(),
    type: input.type || "wedding",
    eventDate: input.eventDate || "",
    status: "import",
    createdAt: now,
    updatedAt: now,
    year,
    photoCount: 0,
    keeperCount: 0,
    lrPreset: (input.lrPreset || "").trim(),
    editBrief: (input.editBrief || "").trim(),
  };
}

/** Jobs counting toward this year’s capacity meter. */
export function jobsInYear(jobs: ShootJob[], year: number): ShootJob[] {
  return jobs.filter((j) => j.year === year);
}

export function countByStatus(
  jobs: ShootJob[]
): Record<JobStatus, number> {
  const base: Record<JobStatus, number> = {
    import: 0,
    cull: 0,
    edit: 0,
    send: 0,
    done: 0,
  };
  for (const j of jobs) base[j.status] += 1;
  return base;
}

export async function getYearCapacity(): Promise<number> {
  const n = await get<number>(CAPACITY_KEY);
  if (typeof n === "number" && n >= 1 && n <= 200) return n;
  return DEFAULT_YEAR_CAPACITY;
}

export async function setYearCapacity(n: number): Promise<number> {
  const clamped = Math.max(1, Math.min(200, Math.round(n)));
  await set(CAPACITY_KEY, clamped);
  return clamped;
}

/**
 * Rough time-saved estimate for volume shooters.
 * Assumes ~2–4 sec per frame for manual cull vs auto-pick assist.
 */
export function estimateMinutesSaved(
  photoCount: number,
  keeperCount: number
): number {
  if (photoCount <= 0) return 0;
  // Manual full review ~3s/frame; with stacks+auto-pick ~0.8s/frame
  const manualSec = photoCount * 3;
  const assistedSec = photoCount * 0.8 + keeperCount * 0.5;
  return Math.max(0, Math.round((manualSec - assistedSec) / 60));
}

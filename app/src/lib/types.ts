export type Verdict = "unset" | "keep" | "reject" | "flag";

/** How the browser can treat this file for preview. */
export type PhotoFormat =
  | "jpeg"
  | "png"
  | "webp"
  | "gif"
  | "heic"
  | "tiff"
  | "raw"
  | "other";

export interface LensPhoto {
  id: string;
  name: string;
  /**
   * Object URL for **display** (thumbnail when we built one; otherwise best effort).
   * Never use a dead/fake score path — if previewOk is false, UI shows a clear fail state.
   */
  url: string;
  size: number;
  lastModified: number;
  /** Near-duplicate stack id (real bursts only — not whole-shoot mega stacks) */
  stackId: string;
  /**
   * 0–1 technical score when decode succeeded.
   * `null` = could not score (RAW/HEIC unsupported / decode fail) — never invent 0.41.
   */
  score: number | null;
  /**
   * Laplacian-variance style sharpness proxy (raw, higher = sharper).
   */
  sharpness?: number;
  soft: boolean;
  /** True only if we decoded pixels and have a usable preview. */
  previewOk: boolean;
  format: PhotoFormat;
  verdict: Verdict;
  favorite: boolean;
}

export interface ClientGallery {
  id: string;
  title: string;
  createdAt: number;
  pin?: string;
  /** Photo ids included */
  photoIds: string[];
  clientFavorites: string[];
  message: string;
}

/** Wedding / event shooters: 20–40+ jobs per year. */
export type JobType = "wedding" | "event" | "engagement" | "portrait" | "other";

/**
 * Pipeline status for a booked shoot.
 * cull = pick keepers · edit = in Lightroom · send = client gallery · done = delivered
 */
export type JobStatus = "import" | "cull" | "edit" | "send" | "done";

/**
 * One client job (wedding, event, etc.).
 */
export interface ShootJob {
  id: string;
  name: string;
  clientName: string;
  type: JobType;
  /** Event date YYYY-MM-DD if known */
  eventDate: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  /** Calendar year this job counts toward capacity (20–40 target) */
  year: number;
  photoCount: number;
  keeperCount: number;
  galleryId?: string;
  /**
   * Lightroom-first: named develop preset / look goal
   */
  lrPreset: string;
  /** One-line edit brief for consistent high-quality LR work */
  editBrief: string;
  adobeExportedAt?: number;
  editDoneAt?: number;
  deliveredAt?: number;
  /** Rough minutes saved estimate from auto-pick (UX, not science) */
  minutesSavedEstimate?: number;
}

export type AppPhase =
  | "home"
  | "jobs"
  | "cull"
  | "edit"
  | "gallery"
  | "client";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  wedding: "Wedding",
  event: "Event",
  engagement: "Engagement",
  portrait: "Portrait",
  other: "Other",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  import: "Import",
  cull: "Pick",
  edit: "Lightroom",
  send: "Send",
  done: "Done",
};

/** Default annual capacity for wedding/event volume shooters */
export const DEFAULT_YEAR_CAPACITY = 40;

import { create } from "zustand";
import type {
  AppPhase,
  ClientGallery,
  LensPhoto,
  ShootJob,
  Verdict,
} from "./lib/types";
import {
  applyAutoPick,
  clearOriginalFiles,
  ingestFiles,
  keepers,
} from "./lib/cullEngine";
import { handoffToAdobe } from "./lib/adobe";
import { newGalleryId, saveGallery } from "./lib/galleryStore";
import {
  createJobDraft,
  deleteJob as deleteJobFromIdb,
  estimateMinutesSaved,
  getYearCapacity,
  listJobs,
  patchJob,
  saveJob,
  setYearCapacity as persistYearCapacity,
  type NewJobInput,
} from "./lib/jobStore";
import { exportLrSelectPackage } from "./lib/lrExport";
import {
  clearSession,
  loadSession,
  revokePhotoUrls,
  saveSession,
} from "./lib/sessionStore";

interface LensState {
  phase: AppPhase;
  photos: LensPhoto[];
  busy: boolean;
  status: string;
  adobeHint: { title: string; steps: string[] } | null;
  lastGallery: ClientGallery | null;
  /** True after first hydrate attempt finishes (jobs + optional session). */
  ready: boolean;
  sessionRestored: boolean;

  /** Year pipeline for 20–40 job shooters */
  jobs: ShootJob[];
  activeJobId: string | null;
  yearCapacity: number;
  year: number;

  setPhase: (p: AppPhase) => void;
  hydrate: () => Promise<void>;
  hydrateJobs: () => Promise<void>;
  createJob: (input: NewJobInput) => Promise<ShootJob>;
  selectJob: (id: string | null) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  setYearCapacity: (n: number) => Promise<void>;
  updateActiveJobBrief: (lrPreset: string, editBrief: string) => Promise<void>;
  syncJobCounts: () => Promise<void>;
  persistNow: () => Promise<void>;

  importFiles: (files: FileList | File[]) => Promise<void>;
  setVerdict: (id: string, v: Verdict) => void;
  autoPick: () => void;
  runAdobeHandoff: () => Promise<void>;
  exportSelectsPackage: () => void;
  markEditDone: () => Promise<void>;
  createClientGallery: (
    title: string,
    message: string,
    pin?: string
  ) => Promise<string>;
  clearStatus: () => void;
  clearShoot: () => Promise<void>;
}

function activeJob(get: () => LensState): ShootJob | null {
  const { jobs, activeJobId } = get();
  return jobs.find((j) => j.id === activeJobId) || null;
}

/** Debounced session write — verdict spam shouldn't thrash IDB. */
let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(get: () => LensState): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void get().persistNow();
  }, 450);
}

function replacePhotos(
  set: (partial: Partial<LensState>) => void,
  get: () => LensState,
  next: LensPhoto[]
): void {
  const prev = get().photos;
  if (prev.length && prev !== next) {
    // Only revoke urls that are not reused (new import always new urls)
    const nextUrls = new Set(next.map((p) => p.url));
    revokePhotoUrls(prev.filter((p) => !nextUrls.has(p.url)));
  }
  set({ photos: next });
}

export const useLens = create<LensState>((set, get) => ({
  phase: "home",
  photos: [],
  busy: false,
  status: "",
  adobeHint: null,
  lastGallery: null,
  ready: false,
  sessionRestored: false,

  jobs: [],
  activeJobId: null,
  yearCapacity: 40,
  year: new Date().getFullYear(),

  setPhase: (phase) => {
    set({ phase });
    if (get().photos.length) schedulePersist(get);
  },

  clearStatus: () => set({ status: "", adobeHint: null }),

  persistNow: async () => {
    const { photos, activeJobId, phase } = get();
    try {
      await saveSession(photos, activeJobId, phase);
    } catch (e) {
      console.warn("[Lens] session save failed", e);
    }
  },

  hydrate: async () => {
    set({ busy: true, status: "Opening studio…" });
    try {
      const [jobs, yearCapacity, session] = await Promise.all([
        listJobs(),
        getYearCapacity(),
        loadSession(),
      ]);

      if (session && session.photos.length) {
        const jobId = session.meta.jobId;
        const jobExists =
          !jobId || jobs.some((j) => j.id === jobId);
        const activeJobId = jobExists ? jobId : null;
        const phase =
          session.meta.phase === "client" ? "cull" : session.meta.phase;
        set({
          jobs,
          yearCapacity,
          photos: session.photos,
          activeJobId,
          phase: phase === "home" || phase === "jobs" ? "cull" : phase,
          ready: true,
          sessionRestored: true,
          busy: false,
          status: `Resumed ${session.photos.length} photos — pick up where you left off.`,
        });
        return;
      }

      set({
        jobs,
        yearCapacity,
        ready: true,
        sessionRestored: false,
        busy: false,
        status: "",
      });
    } catch (e) {
      set({
        ready: true,
        busy: false,
        status:
          e instanceof Error ? e.message : "Could not restore last session",
      });
    }
  },

  hydrateJobs: async () => {
    // Back-compat: full hydrate preferred
    if (!get().ready) {
      await get().hydrate();
      return;
    }
    const [jobs, yearCapacity] = await Promise.all([
      listJobs(),
      getYearCapacity(),
    ]);
    set({ jobs, yearCapacity });
  },

  createJob: async (input) => {
    const job = createJobDraft(input);
    await saveJob(job);
    const jobs = await listJobs();
    set({
      jobs,
      activeJobId: job.id,
      phase: "home",
      status: `Job “${job.name}” ready — drop the shoot folder to start.`,
    });
    schedulePersist(get);
    return job;
  },

  selectJob: async (id) => {
    if (!id) {
      set({ activeJobId: null });
      schedulePersist(get);
      return;
    }
    const job = get().jobs.find((j) => j.id === id);
    set({
      activeJobId: id,
      status: job
        ? `Active job: ${job.name} · ${job.status}`
        : "Job selected",
    });
    schedulePersist(get);
  },

  removeJob: async (id) => {
    await deleteJobFromIdb(id);
    const jobs = await listJobs();
    const activeJobId =
      get().activeJobId === id ? null : get().activeJobId;
    set({ jobs, activeJobId, status: "Job removed from pipeline." });
    schedulePersist(get);
  },

  setYearCapacity: async (n) => {
    const yearCapacity = await persistYearCapacity(n);
    set({ yearCapacity });
  },

  updateActiveJobBrief: async (lrPreset, editBrief) => {
    const job = activeJob(get);
    if (!job) {
      set({ status: "Create or select a job first to save the LR look." });
      return;
    }
    const next = await patchJob(job.id, { lrPreset, editBrief });
    if (!next) return;
    const jobs = await listJobs();
    set({ jobs, status: "Lightroom look saved on job." });
  },

  syncJobCounts: async () => {
    const job = activeJob(get);
    if (!job) return;
    const { photos } = get();
    const k = keepers(photos).length;
    const minutes = estimateMinutesSaved(photos.length, k);
    await patchJob(job.id, {
      photoCount: photos.length,
      keeperCount: k,
      minutesSavedEstimate: minutes,
      status:
        job.status === "import" || job.status === "cull"
          ? photos.length
            ? "cull"
            : "import"
          : job.status,
    });
    const jobs = await listJobs();
    set({ jobs });
  },

  clearShoot: async () => {
    revokePhotoUrls(get().photos);
    clearOriginalFiles();
    await clearSession();
    set({
      photos: [],
      adobeHint: null,
      sessionRestored: false,
      phase: "home",
      status: "Shoot cleared from this device. Jobs & galleries stay.",
    });
  },

  importFiles: async (files) => {
    set({ busy: true, status: "Building previews…" });
    try {
      const result = await ingestFiles(files, (done, total) => {
        set({
          status: `Building previews ${done}/${total}…`,
        });
      });
      const { photos, previewOk, previewFailed, rawCount } = result;
      if (!photos.length) {
        set({
          busy: false,
          status:
            "No images found. Use JPEG/PNG/WebP (or HEIC if this browser supports it).",
        });
        return;
      }
      const k = keepers(photos).length;
      const minutes = estimateMinutesSaved(photos.length, k);
      const job = activeJob(get);
      if (job) {
        await patchJob(job.id, {
          photoCount: photos.length,
          keeperCount: k,
          minutesSavedEstimate: minutes,
          status: "cull",
        });
      }
      const jobs = await listJobs();
      replacePhotos(set, get, photos);

      const parts = [
        `${previewOk} previews`,
        previewFailed
          ? `${previewFailed} couldn’t decode${rawCount ? ` (${rawCount} RAW)` : ""}`
          : null,
        `${k} keepers ready`,
      ].filter(Boolean);

      set({
        jobs,
        busy: false,
        phase: "cull",
        sessionRestored: false,
        status: parts.join(" · "),
      });
      // Thumbs only — don't block cull on a huge IDB write
      void get().persistNow();
    } catch (e) {
      set({
        busy: false,
        status: e instanceof Error ? e.message : "Import failed",
      });
    }
  },

  setVerdict: (id, v) => {
    const photos = get().photos.map((p) =>
      p.id === id ? { ...p, verdict: v } : p
    );
    set({ photos });
    void get().syncJobCounts();
    schedulePersist(get);
  },

  autoPick: () => {
    const photos = applyAutoPick(get().photos);
    const k = keepers(photos).length;
    set({
      photos,
      status: `${k} keepers selected (auto-pick)`,
    });
    void get().syncJobCounts();
    schedulePersist(get);
  },

  runAdobeHandoff: async () => {
    const { photos } = get();
    const job = activeJob(get);
    set({ busy: true, status: "Packing keepers for Lightroom…" });
    const zipName = job
      ? `Lens-Keepers-${job.name.replace(/[^\w-]+/g, "-").slice(0, 32)}.zip`
      : undefined;
    const { count, hint, mode } = await handoffToAdobe(photos, zipName);
    if (count === 0) {
      set({
        busy: false,
        adobeHint: hint,
        status: "Mark some keepers first.",
      });
      return;
    }
    exportLrSelectPackage(photos, job);
    if (job) {
      await patchJob(job.id, {
        status: "edit",
        adobeExportedAt: Date.now(),
        keeperCount: count,
        photoCount: photos.length,
        minutesSavedEstimate: estimateMinutesSaved(photos.length, count),
      });
    }
    const jobs = await listJobs();
    set({
      jobs,
      busy: false,
      phase: "edit",
      adobeHint: hint,
      status:
        mode === "zip"
          ? `${count} keepers zipped + selects/brief exported — edit in Lightroom.`
          : `${count} keepers downloading + selects/brief — edit in Lightroom.`,
    });
    schedulePersist(get);
  },

  exportSelectsPackage: () => {
    const { photos } = get();
    const job = activeJob(get);
    const result = exportLrSelectPackage(photos, job);
    if (!result.keeperCount) {
      set({ status: "Need keepers before exporting selects." });
      return;
    }
    set({
      status: `Exported selects CSV + edit brief (${result.keeperCount} keepers).`,
    });
  },

  markEditDone: async () => {
    const job = activeJob(get);
    if (job) {
      await patchJob(job.id, {
        status: "send",
        editDoneAt: Date.now(),
      });
      const jobs = await listJobs();
      set({
        jobs,
        phase: "gallery",
        status: "Edits marked done — create the client gallery.",
      });
      schedulePersist(get);
      return;
    }
    set({
      phase: "gallery",
      status: "Create the client gallery when finals are ready.",
    });
    schedulePersist(get);
  },

  createClientGallery: async (title, message, pin) => {
    const { photos } = get();
    const k = keepers(photos);
    if (!k.length) {
      set({ status: "Need keepers before sending to client." });
      throw new Error("No keepers");
    }
    set({ busy: true, status: "Building durable client gallery…" });
    const job = activeJob(get);
    const gallery: ClientGallery = {
      id: newGalleryId(),
      title: title || job?.name || "Your photos",
      createdAt: Date.now(),
      pin: pin?.trim() || undefined,
      photoIds: k.map((p) => p.id),
      clientFavorites: [],
      message:
        message ||
        "Tap a photo to favorite. We’ll deliver the finals soon.",
    };
    await saveGallery(gallery, k);
    if (job) {
      await patchJob(job.id, {
        status: "done",
        galleryId: gallery.id,
        deliveredAt: Date.now(),
        keeperCount: k.length,
      });
    }
    const jobs = await listJobs();
    set({
      busy: false,
      jobs,
      lastGallery: gallery,
      phase: "gallery",
      status: job
        ? `“${job.name}” delivered — share the client link.`
        : "Client gallery ready to share.",
    });
    schedulePersist(get);
    return gallery.id;
  },
}));

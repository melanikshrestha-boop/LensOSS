/**
 * Durable shoot session — thumbs + verdicts only (not full originals).
 * Full-res ZIP needs originals in memory (this session) or re-import.
 */
import { get, set, del } from "idb-keyval";
import type { AppPhase, LensPhoto, PhotoFormat, Verdict } from "./types";

const META_KEY = "lens-session-meta-v1";
const BLOBS_KEY = "lens-session-blobs-v1";

const SAVE_CONCURRENCY = 6;

export type SessionPhotoMeta = {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  stackId: string;
  score: number | null;
  sharpness?: number;
  soft: boolean;
  verdict: Verdict;
  favorite: boolean;
  previewOk: boolean;
  format: PhotoFormat;
};

export type ShootSessionMeta = {
  version: 2;
  jobId: string | null;
  phase: AppPhase;
  photos: SessionPhotoMeta[];
  updatedAt: number;
};

type BlobMap = Record<string, Blob>;

function metaFromPhoto(p: LensPhoto): SessionPhotoMeta {
  return {
    id: p.id,
    name: p.name,
    size: p.size,
    lastModified: p.lastModified,
    stackId: p.stackId,
    score: p.score,
    sharpness: p.sharpness,
    soft: p.soft,
    verdict: p.verdict,
    favorite: p.favorite,
    previewOk: p.previewOk,
    format: p.format,
  };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

async function materializeBlob(
  url: string,
  prior: Blob | undefined
): Promise<Blob | null> {
  if (!url) return prior ?? null;
  try {
    const res = await fetch(url);
    if (!res.ok) return prior ?? null;
    return await res.blob();
  } catch {
    return prior ?? null;
  }
}

export async function saveSession(
  photos: LensPhoto[],
  jobId: string | null,
  phase: AppPhase
): Promise<void> {
  if (!photos.length) {
    await clearSession();
    return;
  }

  const priorBlobs = (await get<BlobMap>(BLOBS_KEY)) || {};
  const nextBlobs: BlobMap = {};
  const wanted = new Set(photos.map((p) => p.id));

  for (const id of Object.keys(priorBlobs)) {
    if (wanted.has(id)) nextBlobs[id] = priorBlobs[id];
  }

  // Only persist preview thumbs (urls point at thumb blobs after ingest)
  const missing = photos.filter((p) => p.previewOk && p.url && !nextBlobs[p.id]);
  if (missing.length) {
    await mapPool(missing, SAVE_CONCURRENCY, async (p) => {
      const blob = await materializeBlob(p.url, priorBlobs[p.id]);
      if (blob) nextBlobs[p.id] = blob;
      return null;
    });
  }

  const meta: ShootSessionMeta = {
    version: 2,
    jobId,
    phase:
      phase === "client"
        ? "cull"
        : phase === "home" || phase === "jobs"
          ? photos.length
            ? "cull"
            : phase
          : phase,
    photos: photos.map(metaFromPhoto),
    updatedAt: Date.now(),
  };

  await set(META_KEY, meta);
  await set(BLOBS_KEY, nextBlobs);
}

export async function loadSession(): Promise<{
  meta: ShootSessionMeta;
  photos: LensPhoto[];
} | null> {
  const meta = await get<ShootSessionMeta>(META_KEY);
  if (!meta?.photos?.length) return null;

  const blobs = (await get<BlobMap>(BLOBS_KEY)) || {};
  const photos: LensPhoto[] = [];

  for (const m of meta.photos) {
    const blob = blobs[m.id];
    const hasBlob = blob instanceof Blob;
    const previewOk = Boolean(m.previewOk && hasBlob);
    photos.push({
      id: m.id,
      name: m.name,
      url: hasBlob ? URL.createObjectURL(blob) : "",
      size: m.size,
      lastModified: m.lastModified,
      stackId: m.stackId,
      // Migrate old fake scores: if v1 had score but no preview, treat as null
      score: previewOk ? (m.score ?? null) : null,
      sharpness: m.sharpness,
      soft: m.soft ?? false,
      previewOk,
      format: m.format || "other",
      verdict: m.verdict,
      favorite: m.favorite ?? false,
    });
  }

  if (!photos.length) return null;
  return { meta, photos };
}

export async function clearSession(): Promise<void> {
  await del(META_KEY);
  await del(BLOBS_KEY);
}

export function revokePhotoUrls(photos: LensPhoto[]): void {
  for (const p of photos) {
    if (p.url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(p.url);
      } catch {
        /* ignore */
      }
    }
  }
}

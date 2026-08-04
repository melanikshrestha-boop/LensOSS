/**
 * Cull engine — previews, scores, stacks that actually work.
 *
 * Laws:
 * 1. Never invent a score when decode failed (no more fake "41").
 * 2. Grid uses small JPEG thumbs, not full-res files.
 * 3. Stacks are real bursts only (tight time + same stem), hard-capped.
 * 4. Keep original File in memory for ZIP export; session stores thumbs only.
 */
import type { LensPhoto, PhotoFormat, Verdict } from "./types";

/** Longest edge for grid/loupe thumbs (fast paint, low memory). */
const THUMB_MAX = 360;
/** JPEG quality for thumbs. */
const THUMB_QUALITY = 0.82;
/** Longest edge when sampling sharpness. */
const SAMPLE_MAX = 240;
/** Concurrent decode workers. */
const SCORE_CONCURRENCY = 3;

const KEEP_THRESHOLD = 0.62;
const REJECT_THRESHOLD = 0.4;

/** Burst: max gap between consecutive frames (ms). */
const BURST_DT_MS = 450;
/** Burst: max relative size difference. */
const BURST_SIZE_RATIO = 0.1;
/** Never build stacks larger than this (kills mega-stack bug). */
const MAX_STACK_SIZE = 8;

// ── Original files for Adobe ZIP (session memory only) ─────────────────────

const originalFiles = new Map<string, File>();

export function getOriginalFile(id: string): File | undefined {
  return originalFiles.get(id);
}

export function clearOriginalFiles(): void {
  originalFiles.clear();
}

export function rememberOriginal(id: string, file: File): void {
  originalFiles.set(id, file);
}

// ── Format detection ───────────────────────────────────────────────────────

const RAW_EXT =
  /\.(cr2|cr3|nef|nrw|arw|srf|sr2|dng|orf|rw2|pef|raf|3fr|fff|dcr|kdc|mos|mef|mrw|x3f|rwl)$/i;

export function detectFormat(file: File): PhotoFormat {
  const n = file.name.toLowerCase();
  const t = (file.type || "").toLowerCase();
  if (t === "image/jpeg" || /\.jpe?g$/i.test(n)) return "jpeg";
  if (t === "image/png" || /\.png$/i.test(n)) return "png";
  if (t === "image/webp" || /\.webp$/i.test(n)) return "webp";
  if (t === "image/gif" || /\.gif$/i.test(n)) return "gif";
  if (
    t === "image/heic" ||
    t === "image/heif" ||
    /\.(heic|heif)$/i.test(n)
  )
    return "heic";
  if (t === "image/tiff" || /\.tiff?$/i.test(n)) return "tiff";
  if (RAW_EXT.test(n)) return "raw";
  if (t.startsWith("image/")) return "other";
  return "other";
}

function isProbablyImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif|tiff?|cr2|cr3|nef|arw|dng|orf|rw2|raf)$/i.test(
    file.name
  );
}

// ── Math helpers ───────────────────────────────────────────────────────────

function clamp(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function normalizeSharpness(variance: number): number {
  const n = Math.log1p(variance) / Math.log1p(2500);
  return clamp(n);
}

function laplacianVariance(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): number {
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap =
        -4 * gray[i] +
        gray[i - 1] +
        gray[i + 1] +
        gray[i - w] +
        gray[i + w];
      sum += lap;
      sumSq += lap * lap;
      n++;
    }
  }
  if (n === 0) return 0;
  const mean = sum / n;
  return Math.max(0, sumSq / n - mean * mean);
}

/**
 * Decode once → build thumb blob + sharpness sample.
 * Failures return ok:false — caller must not invent a score.
 */
async function decodeAndThumb(file: File): Promise<{
  ok: boolean;
  thumbBlob: Blob | null;
  width: number;
  height: number;
  sharpness: number;
  soft: boolean;
}> {
  let bmp: ImageBitmap | null = null;
  try {
    bmp = await createImageBitmap(file);
    const width = bmp.width;
    const height = bmp.height;
    if (width < 1 || height < 1) {
      return {
        ok: false,
        thumbBlob: null,
        width: 0,
        height: 0,
        sharpness: 0,
        soft: false,
      };
    }

    // Sharpness sample
    const sScale = Math.min(1, SAMPLE_MAX / Math.max(width, height));
    const sw = Math.max(1, Math.round(width * sScale));
    const sh = Math.max(1, Math.round(height * sScale));

    let variance = 0;
    if (typeof OffscreenCanvas !== "undefined") {
      const sc = new OffscreenCanvas(sw, sh);
      const sctx = sc.getContext("2d", { willReadFrequently: true });
      if (sctx) {
        sctx.drawImage(bmp, 0, 0, sw, sh);
        variance = laplacianVariance(
          sctx as unknown as CanvasRenderingContext2D,
          sw,
          sh
        );
      }
    } else {
      const sc = document.createElement("canvas");
      sc.width = sw;
      sc.height = sh;
      const sctx = sc.getContext("2d", { willReadFrequently: true });
      if (sctx) {
        sctx.drawImage(bmp, 0, 0, sw, sh);
        variance = laplacianVariance(sctx, sw, sh);
      }
    }

    // Display thumb
    const tScale = Math.min(1, THUMB_MAX / Math.max(width, height));
    const tw = Math.max(1, Math.round(width * tScale));
    const th = Math.max(1, Math.round(height * tScale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    let thumbBlob: Blob | null = null;
    if (ctx) {
      ctx.drawImage(bmp, 0, 0, tw, th);
      thumbBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", THUMB_QUALITY);
      });
    }

    const softDim = width < 800 || height < 800;
    const softSharp = variance < 25;

    return {
      ok: Boolean(thumbBlob),
      thumbBlob,
      width,
      height,
      sharpness: variance,
      soft: softDim || softSharp,
    };
  } catch {
    return {
      ok: false,
      thumbBlob: null,
      width: 0,
      height: 0,
      sharpness: 0,
      soft: false,
    };
  } finally {
    bmp?.close();
  }
}

/** Honest score — returns null when we never saw pixels. */
function scoreFromDecode(
  file: File,
  width: number,
  height: number,
  sharpness: number,
  soft: boolean
): number {
  let score = 0.45;
  if (file.size > 2_000_000) score += 0.08;
  if (file.size > 5_000_000) score += 0.06;
  if (file.size < 200_000) score -= 0.2;

  const mp = (width * height) / 1_000_000;
  if (mp >= 12) score += 0.08;
  if (mp >= 20) score += 0.04;
  if (mp < 2) score -= 0.15;
  if (width < 800 || height < 800) score -= 0.12;

  const sharp01 = normalizeSharpness(sharpness);
  score += sharp01 * 0.35;
  if (sharp01 < 0.25) score -= 0.18;
  if (soft) score -= 0.1;

  return clamp(score);
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

function defaultVerdict(score: number | null, soft: boolean): Verdict {
  if (score == null) return "unset";
  if (soft) return "reject";
  if (score >= KEEP_THRESHOLD) return "keep";
  return "unset";
}

/** Filename stem for burst grouping (strip extension + trailing digits). */
function nameStem(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]?\d{1,5}$/, "") || name;
}

/**
 * Real bursts only: same name stem, ≤450ms apart, similar size, max 8 frames.
 * Each photo starts unique — we only merge true consecutive bursts.
 */
function applyBurstStacks(photos: LensPhoto[]): void {
  if (photos.length < 2) return;

  // Start unique
  for (const p of photos) {
    p.stackId = `solo_${p.id}`;
  }

  const ordered = [...photos].sort((a, b) => {
    if (a.lastModified !== b.lastModified) return a.lastModified - b.lastModified;
    return a.name.localeCompare(b.name);
  });

  let groupIdx = 0;
  let run: LensPhoto[] = [ordered[0]];

  const flush = () => {
    if (run.length < 2) {
      run = [];
      return;
    }
    // Cap size — if somehow longer, only keep the tightest window from the end
    const slice = run.length > MAX_STACK_SIZE ? run.slice(-MAX_STACK_SIZE) : run;
    const sid = `burst_${groupIdx++}`;
    for (const p of slice) p.stackId = sid;
    run = [];
  };

  for (let i = 1; i < ordered.length; i++) {
    const prev = run[run.length - 1] ?? ordered[i - 1];
    const cur = ordered[i];
    const dt = cur.lastModified - prev.lastModified;
    const sizeRatio =
      prev.size > 0 ? Math.abs(cur.size - prev.size) / prev.size : 1;
    const sameStem = nameStem(cur.name) === nameStem(prev.name);

    const canJoin =
      sameStem &&
      dt >= 0 &&
      dt <= BURST_DT_MS &&
      sizeRatio <= BURST_SIZE_RATIO &&
      run.length < MAX_STACK_SIZE;

    if (canJoin) {
      if (run.length === 0) run.push(prev);
      run.push(cur);
    } else {
      flush();
      run = [cur];
    }
  }
  flush();
}

/**
 * Within each stack: best scored non-soft frame stays keep; others reject.
 * Unscored frames stay unset.
 */
function applyStackDefaults(photos: LensPhoto[]): void {
  const byStack = new Map<string, LensPhoto[]>();
  for (const p of photos) {
    const arr = byStack.get(p.stackId) || [];
    arr.push(p);
    byStack.set(p.stackId, arr);
  }
  for (const stack of byStack.values()) {
    if (stack.length < 2) continue;
    const scored = stack.filter((p) => p.score != null);
    scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (!scored.length) continue;
    const winnerId = scored.find((p) => !p.soft)?.id ?? scored[0].id;
    for (const p of stack) {
      if (p.id === winnerId && p.score != null && !p.soft) p.verdict = "keep";
      else if (p.id !== winnerId && p.verdict === "keep") p.verdict = "reject";
      else if (p.id !== winnerId && p.score != null && p.verdict === "unset") {
        // Soft default: only auto-reject clear stack losers when scored
        if (p.score < (scored[0].score ?? 1) - 0.02) p.verdict = "reject";
      }
    }
  }
}

export type IngestResult = {
  photos: LensPhoto[];
  /** Files we accepted into the list */
  total: number;
  /** Decoded + thumb OK */
  previewOk: number;
  /** Decode/thumb failed (RAW, bad HEIC, corrupt) */
  previewFailed: number;
  /** Count of RAW files in the set */
  rawCount: number;
};

export type IngestProgress = (done: number, total: number) => void;

/**
 * Ingest folder: thumbs first, honest scores, real burst stacks.
 */
export async function ingestFiles(
  files: FileList | File[],
  onProgress?: IngestProgress
): Promise<IngestResult> {
  clearOriginalFiles();

  const list = Array.from(files).filter(isProbablyImage);
  const total = list.length;

  const photos = await mapPool(list, SCORE_CONCURRENCY, async (file, index) => {
    const format = detectFormat(file);
    const id = `p_${index}_${file.name}_${file.size}_${file.lastModified}`;
    rememberOriginal(id, file);

    const decoded = await decodeAndThumb(file);
    onProgress?.(index + 1, total);

    if (!decoded.ok || !decoded.thumbBlob) {
      // No fake score. Preview URL only if browser might still show JPEG-ish types
      // (we already failed createImageBitmap — don't use broken full file as thumb)
      return {
        id,
        name: file.name,
        url: "", // grid shows fail state
        size: file.size,
        lastModified: file.lastModified,
        stackId: `solo_${id}`,
        score: null,
        sharpness: undefined,
        soft: false,
        previewOk: false,
        format,
        verdict: "unset" as const,
        favorite: false,
      } satisfies LensPhoto;
    }

    const score = scoreFromDecode(
      file,
      decoded.width,
      decoded.height,
      decoded.sharpness,
      decoded.soft
    );

    return {
      id,
      name: file.name,
      url: URL.createObjectURL(decoded.thumbBlob),
      size: file.size,
      lastModified: file.lastModified,
      stackId: `solo_${id}`,
      score,
      sharpness: decoded.sharpness,
      soft: decoded.soft,
      previewOk: true,
      format,
      verdict: defaultVerdict(score, decoded.soft),
      favorite: false,
    } satisfies LensPhoto;
  });

  applyBurstStacks(photos);
  applyStackDefaults(photos);

  // Sort: preview-ok + high score first; failed previews at end
  photos.sort((a, b) => {
    if (a.previewOk !== b.previewOk) return a.previewOk ? -1 : 1;
    const sa = a.score ?? -1;
    const sb = b.score ?? -1;
    return sb - sa;
  });

  const previewOk = photos.filter((p) => p.previewOk).length;
  const previewFailed = photos.length - previewOk;
  const rawCount = photos.filter((p) => p.format === "raw").length;

  return { photos, total, previewOk, previewFailed, rawCount };
}

/** Keep + flag only — Adobe / client gallery. */
export function keepers(photos: LensPhoto[]): LensPhoto[] {
  return photos.filter((p) => p.verdict === "keep" || p.verdict === "flag");
}

export function stackGroups(photos: LensPhoto[]): Map<string, LensPhoto[]> {
  const m = new Map<string, LensPhoto[]>();
  for (const p of photos) {
    const arr = m.get(p.stackId) || [];
    arr.push(p);
    m.set(p.stackId, arr);
  }
  return m;
}

/**
 * Auto-pick only on scored frames. Unscored stay unset (human must decide).
 */
export function applyAutoPick(photos: LensPhoto[]): LensPhoto[] {
  const next = photos.map((p) => {
    if (p.score == null) return { ...p };
    if (p.soft) return { ...p, verdict: "reject" as const };
    if (p.score >= KEEP_THRESHOLD) return { ...p, verdict: "keep" as const };
    if (p.score < REJECT_THRESHOLD) return { ...p, verdict: "reject" as const };
    return { ...p };
  });

  const groups = stackGroups(next);
  for (const stack of groups.values()) {
    if (stack.length < 2) continue;
    const ranked = [...stack]
      .filter((p) => p.score != null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    if (!ranked.length) continue;
    const winnerId = ranked[0].id;
    for (const p of next) {
      if (!stack.some((s) => s.id === p.id)) continue;
      if (p.verdict === "flag") continue;
      if (p.id === winnerId && !p.soft && p.score != null) p.verdict = "keep";
      else if (p.id !== winnerId && p.verdict === "keep") p.verdict = "reject";
    }
  }
  return next;
}

import { get, set } from "idb-keyval";
import type { ClientGallery, LensPhoto } from "./types";

const GALLERIES_KEY = "lens-galleries-v1";
/** Photo preview storage: photoId → compressed JPEG Blob (survives reload). */
const PHOTOS_KEY = "lens-gallery-photos-v1";

/** Max edge (px) for client-gallery previews — keeps IDB small. */
const PREVIEW_MAX_EDGE = 1200;
/** JPEG quality for stored previews (0–1). */
const PREVIEW_QUALITY = 0.82;

type PhotoStore = Record<string, Blob | string>;

export async function saveGallery(
  gallery: ClientGallery,
  photos: LensPhoto[]
): Promise<void> {
  const all = (await get<ClientGallery[]>(GALLERIES_KEY)) || [];
  const next = [gallery, ...all.filter((g) => g.id !== gallery.id)].slice(0, 40);
  await set(GALLERIES_KEY, next);

  // Persist real image bytes — never blob: URLs (they die after reload).
  const map: PhotoStore = (await get<PhotoStore>(PHOTOS_KEY)) || {};
  const wanted = new Set(gallery.photoIds);

  await Promise.all(
    photos
      .filter((p) => wanted.has(p.id))
      .map(async (p) => {
        try {
          const blob = await materializePreview(p.url);
          map[p.id] = blob;
        } catch {
          // Keep any prior durable entry for this id if re-encode fails.
        }
      })
  );

  await set(PHOTOS_KEY, map);
}

/**
 * Load gallery metadata + reconstruct object URLs from durable Blobs.
 * Callers should treat returned urls as session-scoped (createObjectURL).
 */
export async function loadGallery(id: string): Promise<{
  gallery: ClientGallery | null;
  urls: Record<string, string>;
}> {
  const all = (await get<ClientGallery[]>(GALLERIES_KEY)) || [];
  const gallery = all.find((g) => g.id === id) || null;
  const stored = (await get<PhotoStore>(PHOTOS_KEY)) || {};
  const urls: Record<string, string> = {};

  if (gallery) {
    for (const photoId of gallery.photoIds) {
      const entry = stored[photoId];
      if (!entry) continue;

      if (entry instanceof Blob) {
        urls[photoId] = URL.createObjectURL(entry);
      } else if (typeof entry === "string" && entry.startsWith("data:")) {
        // Legacy / fallback: data URLs still work after reload.
        urls[photoId] = entry;
      }
      // Skip dead blob: strings left by the old save path.
    }
  }

  return { gallery, urls };
}

export async function listGalleries(): Promise<ClientGallery[]> {
  return (await get<ClientGallery[]>(GALLERIES_KEY)) || [];
}

export async function toggleClientFavorite(
  galleryId: string,
  photoId: string
): Promise<ClientGallery | null> {
  const all = (await get<ClientGallery[]>(GALLERIES_KEY)) || [];
  const g = all.find((x) => x.id === galleryId);
  if (!g) return null;
  if (g.clientFavorites.includes(photoId)) {
    g.clientFavorites = g.clientFavorites.filter((id) => id !== photoId);
  } else {
    g.clientFavorites = [...g.clientFavorites, photoId];
  }
  await set(GALLERIES_KEY, all);
  return g;
}

/** Client-favorited photo ids for a gallery (empty if missing). */
export async function getClientFavorites(galleryId: string): Promise<string[]> {
  const all = (await get<ClientGallery[]>(GALLERIES_KEY)) || [];
  const g = all.find((x) => x.id === galleryId);
  return g ? [...g.clientFavorites] : [];
}

/**
 * Remove a gallery. Photo blobs stay if another gallery still references them.
 */
export async function deleteGallery(galleryId: string): Promise<boolean> {
  const all = (await get<ClientGallery[]>(GALLERIES_KEY)) || [];
  const target = all.find((g) => g.id === galleryId);
  if (!target) return false;

  const remaining = all.filter((g) => g.id !== galleryId);
  await set(GALLERIES_KEY, remaining);

  // Drop previews only referenced by the deleted gallery.
  const stillUsed = new Set(remaining.flatMap((g) => g.photoIds));
  const map: PhotoStore = (await get<PhotoStore>(PHOTOS_KEY)) || {};
  let changed = false;
  for (const id of target.photoIds) {
    if (!stillUsed.has(id) && id in map) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) await set(PHOTOS_KEY, map);
  return true;
}

export function newGalleryId(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Local-first share URL: same origin + `?g=<id>` (client view reads the query). */
export function galleryShareUrl(galleryId: string): string {
  return `${window.location.origin}${window.location.pathname}?g=${galleryId}`;
}


// ── internals ──────────────────────────────────────────────────────────────

/** Fetch/decode a preview source and re-encode as a durable JPEG Blob. */
async function materializePreview(sourceUrl: string): Promise<Blob> {
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`Failed to read preview: ${res.status}`);
  const raw = await res.blob();
  return compressToJpeg(raw, PREVIEW_MAX_EDGE, PREVIEW_QUALITY);
}

/**
 * Downscale so longest edge ≤ maxEdge, encode JPEG.
 * Falls back to the original blob if canvas encode is unavailable.
 */
function compressToJpeg(
  blob: Blob,
  maxEdge: number,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      try {
        const { width, height } = img;
        const scale =
          Math.max(width, height) > maxEdge
            ? maxEdge / Math.max(width, height)
            : 1;
        const w = Math.max(1, Math.round(width * scale));
        const h = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve(blob);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (out) => {
            URL.revokeObjectURL(objectUrl);
            resolve(out ?? blob);
          },
          "image/jpeg",
          quality
        );
      } catch (e) {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // If decode fails, still try storing the raw bytes.
      resolve(blob);
    };

    img.src = objectUrl;
  });
}

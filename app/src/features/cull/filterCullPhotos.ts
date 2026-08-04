import type { CullFilter } from "./CullToolbar";

/**
 * Filter a photo list for the cull grid (pure helper for parent).
 */
export function filterCullPhotos<
  T extends { id: string; verdict: string; stackId: string },
>(photos: T[], filter: CullFilter, stackSizes?: Map<string, number>): T[] {
  if (filter === "all") return photos;
  if (filter === "keep") return photos.filter((p) => p.verdict === "keep");
  if (filter === "reject") return photos.filter((p) => p.verdict === "reject");
  if (filter === "unset") return photos.filter((p) => p.verdict === "unset");
  if (filter === "flag") return photos.filter((p) => p.verdict === "flag");
  // stacks only: photos that share a stack with at least one other
  const sizes =
    stackSizes ??
    (() => {
      const m = new Map<string, number>();
      for (const p of photos) m.set(p.stackId, (m.get(p.stackId) || 0) + 1);
      return m;
    })();
  return photos.filter((p) => (sizes.get(p.stackId) || 0) > 1);
}

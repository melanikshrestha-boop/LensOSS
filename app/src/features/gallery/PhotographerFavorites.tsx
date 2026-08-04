import { useEffect, useState } from "react";
import { getClientFavorites, loadGallery } from "../../lib/galleryStore";

export interface PhotographerFavoritesProps {
  galleryId: string | null;
  /** Optional preview URLs (photoId → src). If omitted, loads from gallery store. */
  urls?: Record<string, string>;
}

/**
 * Photographer-side read of client favorites: photo ids + heart count.
 * Useful after the client has tapped favorites on the share link.
 */
export function PhotographerFavorites({
  galleryId,
  urls: urlsProp,
}: PhotographerFavoritesProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>(urlsProp ?? {});
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!galleryId) {
      setFavorites([]);
      setTitle("");
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const ids = await getClientFavorites(galleryId);
      if (cancelled) return;
      setFavorites(ids);

      if (!urlsProp) {
        const { gallery, urls: loaded } = await loadGallery(galleryId);
        if (cancelled) {
          for (const src of Object.values(loaded)) {
            if (src.startsWith("blob:")) URL.revokeObjectURL(src);
          }
          return;
        }
        setTitle(gallery?.title ?? "");
        setUrls(loaded);
      } else {
        setUrls(urlsProp);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [galleryId, urlsProp]);

  if (!galleryId) {
    return (
      <p style={{ color: "var(--faint)", fontSize: "0.9rem" }}>
        Create a gallery to see client favorites here.
      </p>
    );
  }

  if (loading) {
    return <p className="status">Loading favorites…</p>;
  }

  const n = favorites.length;

  return (
    <section style={{ marginTop: "1.25rem" }}>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem" }}>
        Client favorites
        {title ? (
          <span style={{ color: "var(--soft)", fontWeight: 500 }}>
            {" "}
            · {title}
          </span>
        ) : null}
      </h3>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "var(--faint)" }}>
        ♥ {n} photo{n === 1 ? "" : "s"} marked by client
      </p>

      {n === 0 ? (
        <p style={{ color: "var(--soft)", fontSize: "0.9rem" }}>
          No favorites yet — share the link and wait for taps.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "0.5rem",
          }}
        >
          {favorites.map((id) => (
            <li
              key={id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.4rem 0.5rem",
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "var(--card)",
              }}
            >
              {urls[id] ? (
                <img
                  src={urls[id]}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: "#ddd",
                  }}
                />
              )}
              <code style={{ fontSize: "0.78rem", color: "var(--soft)" }}>
                {id}
              </code>
              <span style={{ marginLeft: "auto", color: "var(--accent)" }}>
                ♥
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

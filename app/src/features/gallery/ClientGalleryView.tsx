import { useEffect, useState, type FormEvent } from "react";
import {
  loadGallery,
  toggleClientFavorite,
} from "../../lib/galleryStore";
import type { ClientGallery } from "../../lib/types";

export interface ClientGalleryViewProps {
  galleryId: string;
}

/**
 * Full client-facing gallery: load from IDB, optional PIN gate,
 * tap-to-favorite, empty / not-found states.
 */
export function ClientGalleryView({ galleryId }: ClientGalleryViewProps) {
  const [gallery, setGallery] = useState<ClientGallery | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pinOk, setPinOk] = useState(false);
  const [pinTry, setPinTry] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    // Object URLs we create this mount — revoke on cleanup to avoid leaks.
    const created: string[] = [];

    setLoading(true);
    void loadGallery(galleryId).then(({ gallery: g, urls: u }) => {
      if (cancelled) {
        // Unmounted before load finished — free any new object URLs.
        for (const src of Object.values(u)) {
          if (src.startsWith("blob:")) URL.revokeObjectURL(src);
        }
        return;
      }
      for (const src of Object.values(u)) {
        if (src.startsWith("blob:")) created.push(src);
      }
      setGallery(g);
      setUrls(u);
      setPinOk(Boolean(g && !g.pin));
      setLoading(false);
    });

    return () => {
      cancelled = true;
      for (const src of created) URL.revokeObjectURL(src);
    };
  }, [galleryId]);

  if (loading) {
    return (
      <div className="main">
        <p className="status">Loading gallery…</p>
      </div>
    );
  }

  if (!gallery) {
    return (
      <div className="main">
        <p className="status">Gallery not found on this device.</p>
        <p style={{ color: "var(--soft)", fontSize: "0.9rem" }}>
          Local-first V1: the gallery must have been created in this browser.
        </p>
      </div>
    );
  }

  if (!pinOk) {
    return (
      <div className="main">
        <h1>{gallery.title}</h1>
        <p style={{ color: "var(--soft)" }}>
          Enter the PIN from your photographer.
        </p>
        <form
          className="gallery-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (pinTry === gallery.pin) {
              setPinOk(true);
              setErr("");
            } else {
              setErr("Wrong PIN");
            }
          }}
        >
          <label>
            PIN
            <input
              value={pinTry}
              onChange={(e) => setPinTry(e.target.value)}
              autoComplete="one-time-code"
            />
          </label>
          {err ? <p className="status">{err}</p> : null}
          <button type="submit" className="btn btn-primary">
            Open gallery
          </button>
        </form>
      </div>
    );
  }

  const favCount = gallery.clientFavorites.length;
  const hasPhotos = gallery.photoIds.length > 0;

  return (
    <div className="main">
      <h1 style={{ marginTop: 0 }}>{gallery.title}</h1>
      {gallery.message ? (
        <p style={{ color: "var(--soft)" }}>{gallery.message}</p>
      ) : null}
      <p style={{ fontSize: "0.85rem", color: "var(--faint)" }}>
        Tap a photo to favorite · {favCount} favorite{favCount === 1 ? "" : "s"}
      </p>

      {!hasPhotos ? (
        <p className="status">This gallery has no photos yet.</p>
      ) : (
        <div className="client-grid">
          {gallery.photoIds.map((id) => {
            const fav = gallery.clientFavorites.includes(id);
            const src = urls[id];
            return (
              <button
                key={id}
                type="button"
                className={`client-card${fav ? " fav" : ""}`}
                aria-pressed={fav}
                aria-label={fav ? "Remove favorite" : "Add favorite"}
                onClick={() => {
                  void toggleClientFavorite(galleryId, id).then((g) => {
                    if (g) setGallery({ ...g });
                  });
                }}
              >
                {src ? (
                  <img src={src} alt="" />
                ) : (
                  <div
                    style={{
                      aspectRatio: 1,
                      background: "#ddd",
                      borderRadius: 12,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

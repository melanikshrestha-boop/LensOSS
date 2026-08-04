import type { FormEvent } from "react";

export interface GalleryComposerProps {
  title: string;
  message: string;
  pin: string;
  /** Keepers available to put in the gallery (drives button label + disable). */
  photoCount: number;
  busy?: boolean;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
}

/**
 * Photographer form: title, note, optional PIN, create share link.
 * Fully controlled — parent owns state and calls createClientGallery.
 */
export function GalleryComposer({
  title,
  message,
  pin,
  photoCount,
  busy = false,
  onTitleChange,
  onMessageChange,
  onPinChange,
  onSubmit,
}: GalleryComposerProps) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit();
  };

  return (
    <form className="gallery-form" onSubmit={handleSubmit}>
      <label>
        Gallery title
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        Note to client
        <textarea
          rows={3}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        PIN (optional)
        <input
          value={pin}
          onChange={(e) => onPinChange(e.target.value)}
          placeholder="e.g. 4821"
          disabled={busy}
        />
      </label>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={busy || photoCount === 0}
      >
        {busy
          ? "Creating…"
          : `Create share link (${photoCount} photo${photoCount === 1 ? "" : "s"})`}
      </button>
    </form>
  );
}

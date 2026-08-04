import { useState } from "react";

export interface SharePanelProps {
  /** Full client URL, e.g. origin + ?g=galleryId */
  shareUrl: string;
  /** Optional label above the URL */
  label?: string;
}

/**
 * After gallery create: show link, copy to clipboard, open client view.
 */
export function SharePanel({
  shareUrl,
  label = "Share this with your client",
}: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  if (!shareUrl) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text is enough for older browsers — ignore.
    }
  };

  return (
    <div className="share-box">
      <strong>{label}</strong>
      <code>{shareUrl}</code>
      <button type="button" className="btn" onClick={() => void copy()}>
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        className="btn"
        style={{ marginLeft: 8 }}
        onClick={() => window.open(shareUrl, "_blank", "noopener,noreferrer")}
      >
        Open client view
      </button>
    </div>
  );
}

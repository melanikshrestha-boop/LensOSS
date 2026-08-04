/**
 * Adobe handoff — ZIP keepers using original File when available (full quality).
 * Falls back to preview URL only if original is gone (session restore).
 */

import { saveAs } from "file-saver";
import JSZip from "jszip";
import type { LensPhoto } from "./types";
import { getOriginalFile, keepers } from "./cullEngine";

export type AdobeHandoffMode = "zip" | "files";

export type AdobeHint = {
  title: string;
  steps: string[];
};

export type AdobeHandoffResult = {
  count: number;
  hint: AdobeHint;
  mode: AdobeHandoffMode;
  /** True when some keepers used thumbs instead of full originals */
  usedPreviews?: boolean;
};

const DEFAULT_ZIP_NAME = "Lens-Keepers.zip";
const STAGGER_MS = 120;

async function blobForKeeper(p: LensPhoto): Promise<Blob | null> {
  const file = getOriginalFile(p.id);
  if (file) return file;
  if (!p.url) return null;
  try {
    const res = await fetch(p.url);
    if (!res.ok) return null;
    return await res.blob();
  } catch {
    return null;
  }
}

export async function downloadKeepers(
  photos: LensPhoto[],
  folderHint = "Lens-Keepers"
): Promise<number> {
  const list = keepers(photos);
  let n = 0;
  for (const p of list) {
    try {
      const blob = await blobForKeeper(p);
      if (!blob) continue;
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${folderHint}-${p.name}`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      n += 1;
      await new Promise((r) => setTimeout(r, STAGGER_MS));
    } catch {
      /* skip */
    }
  }
  return n;
}

function uniqueEntryName(used: Set<string>, name: string): string {
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  const dot = name.lastIndexOf(".");
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot) : "";
  let i = 2;
  let candidate = `${base}-${i}${ext}`;
  while (used.has(candidate)) {
    i += 1;
    candidate = `${base}-${i}${ext}`;
  }
  used.add(candidate);
  return candidate;
}

export async function downloadKeepersZip(
  photos: LensPhoto[],
  name: string = DEFAULT_ZIP_NAME
): Promise<{ count: number; usedPreviews: boolean }> {
  const list = keepers(photos);
  if (!list.length) return { count: 0, usedPreviews: false };

  const zip = new JSZip();
  const used = new Set<string>();
  let n = 0;
  let usedPreviews = false;

  for (const p of list) {
    try {
      const file = getOriginalFile(p.id);
      const blob = file ?? (await blobForKeeper(p));
      if (!blob) continue;
      if (!file) usedPreviews = true;
      const entry = uniqueEntryName(used, p.name || `keeper-${n + 1}.jpg`);
      zip.file(entry, blob);
      n += 1;
    } catch {
      /* skip */
    }
  }

  if (n === 0) return { count: 0, usedPreviews: false };

  const zipName = name.endsWith(".zip") ? name : `${name}.zip`;
  const out = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  saveAs(out, zipName);
  return { count: n, usedPreviews };
}

export function openAdobeHint(): AdobeHint {
  const isMac = /Mac/i.test(navigator.userAgent);
  const isWin = /Win/i.test(navigator.userAgent);

  const classicImport = isMac
    ? "Lightroom Classic: File → Import Photos and Video… (or drag the keepers folder onto Library)."
    : isWin
      ? "Lightroom Classic: File → Import Photos and Video… and select the keepers folder."
      : "Lightroom Classic: File → Import Photos and Video… and select the downloaded keepers.";

  const cloudImport = isMac
    ? "Lightroom (cloud): File → Import Photos and Video…, or drag keepers into All Photos."
    : "Lightroom (cloud): click the + / Add Photos control, or File → Import, and choose the keepers.";

  const openApp = isMac
    ? "Open the app: Spotlight (⌘Space) → “Lightroom Classic” or “Lightroom”, or Applications → Adobe."
    : isWin
      ? "Open the app: Start menu → Adobe Lightroom Classic or Adobe Lightroom."
      : "Open Adobe Lightroom Classic or Adobe Lightroom from your applications.";

  return {
    title: "Open keepers in Adobe",
    steps: [
      "Keepers are in your default Downloads folder (ZIP or individual files).",
      "If you got a ZIP: double-click to unzip, then import that folder.",
      classicImport,
      cloudImport,
      openApp,
      "Edit in Adobe. Come back to Lens when you’re ready to send the client gallery.",
    ],
  };
}

export function tryOpenLightroom(): boolean {
  const schemes = ["lightroom://", "adobe-lightroom://"] as const;
  try {
    for (const scheme of schemes) {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.setAttribute("aria-hidden", "true");
      iframe.src = scheme;
      document.body.appendChild(iframe);
      window.setTimeout(() => {
        iframe.remove();
      }, 1500);
    }
    return true;
  } catch {
    return false;
  }
}

export async function handoffToAdobe(
  photos: LensPhoto[],
  zipName?: string
): Promise<AdobeHandoffResult> {
  const list = keepers(photos);
  const archiveName = zipName?.endsWith(".zip")
    ? zipName
    : zipName
      ? `${zipName}.zip`
      : DEFAULT_ZIP_NAME;

  if (!list.length) {
    return {
      count: 0,
      mode: "files",
      hint: {
        title: "No keepers yet",
        steps: [
          "Mark photos Keep (or Flag) in Pick.",
          "Then press Open in Adobe again — we’ll ZIP the keepers and walk you through Lightroom import.",
        ],
      },
    };
  }

  let count = 0;
  let mode: AdobeHandoffMode = "zip";
  let usedPreviews = false;

  try {
    const z = await downloadKeepersZip(photos, archiveName);
    count = z.count;
    usedPreviews = z.usedPreviews;
    if (count === 0) {
      count = await downloadKeepers(photos);
      mode = "files";
    }
  } catch {
    count = await downloadKeepers(photos);
    mode = "files";
  }

  tryOpenLightroom();

  const base = openAdobeHint();
  const lead =
    mode === "zip"
      ? `${count} keeper${count === 1 ? "" : "s"} downloading as ${archiveName}. Unzip, then import that folder into Lightroom.`
      : `${count} keeper${count === 1 ? "" : "s"} downloading as individual files.`;

  const previewNote = usedPreviews
    ? "Some files used in-session previews (originals unavailable after reload) — re-import the folder for full-res ZIP next time."
    : "Full originals from this session’s import.";

  const hint: AdobeHint = {
    title: "Open keepers in Lightroom",
    steps: [lead, previewNote, ...base.steps.slice(1)],
  };

  return { count, hint, mode, usedPreviews };
}

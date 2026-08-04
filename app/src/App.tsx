import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { useLens } from "./store";
import {
  CullGrid,
  CullLoupe,
  CullToolbar,
  StackCompare,
  StackStrip,
  filterCullPhotos,
  useCullKeyboard,
  useCullSelection,
  type CullFilter,
} from "./features/cull";
import {
  ClientGalleryView,
  GalleryComposer,
  PhotographerFavorites,
  SharePanel,
  galleryShareUrl,
} from "./features/gallery";
import { AdobeHintBox, AdobeHandoffButton } from "./features/adobe";
import {
  EditPhase,
  JobsBoard,
  type NewJobFormValues,
} from "./features/jobs";
import { JOB_STATUS_LABELS } from "./lib/types";

function useQueryGalleryId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    const u = new URL(window.location.href);
    setId(u.searchParams.get("g"));
  }, []);
  return id;
}

export default function App() {
  const galleryId = useQueryGalleryId();
  if (galleryId) return <ClientGalleryView galleryId={galleryId} />;
  return <Studio />;
}

function Studio() {
  const {
    phase,
    photos,
    busy,
    status,
    adobeHint,
    lastGallery,
    jobs,
    activeJobId,
    yearCapacity,
    year,
    ready,
    sessionRestored,
    setPhase,
    hydrate,
    createJob,
    selectJob,
    removeJob,
    setYearCapacity,
    updateActiveJobBrief,
    importFiles,
    setVerdict,
    autoPick,
    runAdobeHandoff,
    exportSelectsPackage,
    markEditDone,
    createClientGallery,
    clearShoot,
  } = useLens();

  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState("Your gallery");
  const [message, setMessage] = useState(
    "Favorite what you love. We’ll deliver the finals soon."
  );
  const [pin, setPin] = useState("");
  const [filter, setFilter] = useState<CullFilter>("all");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [loupeOpen, setLoupeOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const { selectedId, setSelectedId } = useCullSelection();

  const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeJobId) || null,
    [jobs, activeJobId]
  );

  const [lrPreset, setLrPreset] = useState("");
  const [editBrief, setEditBrief] = useState("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Sync brief fields when active job changes
  useEffect(() => {
    if (activeJob) {
      setLrPreset(activeJob.lrPreset || "");
      setEditBrief(
        activeJob.editBrief ||
          "Same skin, contrast, and white-balance family across the full set."
      );
      if (activeJob.name && title === "Your gallery") {
        setTitle(activeJob.name);
      }
    }
  }, [activeJob?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const stackSizes = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of photos) m.set(p.stackId, (m.get(p.stackId) || 0) + 1);
    return m;
  }, [photos]);

  const stats = useMemo(() => {
    const k = photos.filter((p) => p.verdict === "keep").length;
    const r = photos.filter((p) => p.verdict === "reject").length;
    const u = photos.filter((p) => p.verdict === "unset").length;
    const f = photos.filter((p) => p.verdict === "flag").length;
    // Multi-frame stacks only (near-dupes worth reviewing)
    let stacks = 0;
    for (const n of stackSizes.values()) if (n > 1) stacks += 1;
    return { k, r, u, f, stacks, n: photos.length };
  }, [photos, stackSizes]);

  const visible = useMemo(
    () => filterCullPhotos(photos, filter, stackSizes),
    [photos, filter, stackSizes]
  );
  const visibleIds = useMemo(() => visible.map((p) => p.id), [visible]);

  const getVerdict = useCallback(
    (id: string) => photos.find((p) => p.id === id)?.verdict,
    [photos]
  );

  useCullKeyboard({
    enabled: phase === "cull" && photos.length > 0,
    photoIds: visibleIds,
    selectedId,
    onSelect: setSelectedId,
    onVerdict: setVerdict,
    getVerdict,
    autoAdvance,
    loupeOpen,
    onLoupeChange: setLoupeOpen,
  });

  // Keep selection valid when filter/list changes
  useEffect(() => {
    if (phase !== "cull" || !photos.length) return;
    if (!selectedId || !visibleIds.includes(selectedId)) {
      setSelectedId(visibleIds[0] ?? photos[0]?.id ?? null);
    }
  }, [phase, photos, selectedId, visibleIds, setSelectedId]);

  // Close loupe when leaving cull
  useEffect(() => {
    if (phase !== "cull") setLoupeOpen(false);
  }, [phase]);

  const onFiles = useCallback(
    async (list: FileList | null) => {
      if (!list?.length) return;
      setSelectedId(null);
      setFilter("all");
      setLoupeOpen(false);
      await importFiles(list);
    },
    [importFiles, setSelectedId]
  );

  const selectedPhoto = useMemo(
    () => photos.find((p) => p.id === selectedId) ?? null,
    [photos, selectedId]
  );

  const stackHighlightId = selectedPhoto?.stackId ?? null;

  const stackMates = useMemo(() => {
    if (!selectedPhoto) return [];
    const mates = photos.filter((p) => p.stackId === selectedPhoto.stackId);
    if (mates.length < 2) return [];
    return [...mates].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [photos, selectedPhoto]);

  // C opens 2-up stack compare when selected frame is in a multi-stack
  useEffect(() => {
    if (phase !== "cull") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key !== "c" && e.key !== "C") return;
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      if (compareOpen) return; // StackCompare owns C while open
      if (stackMates.length < 2 || !selectedId) return;
      e.preventDefault();
      setLoupeOpen(false);
      setCompareOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, stackMates.length, selectedId, compareOpen]);

  const shareUrl = lastGallery ? galleryShareUrl(lastGallery.id) : "";
  const keeperCount = stats.k + stats.f;
  const unsetCount = stats.u;

  const onCreateJob = async (values: NewJobFormValues) => {
    await createJob(values);
  };

  /** One primary next step for a tired shooter — not nine equal CTAs. */
  const nextStep = useMemo(() => {
    if (photos.length && unsetCount > 0) {
      return {
        label: "Continue picking",
        detail: `${unsetCount} still open · ${keeperCount} keepers`,
        action: () => setPhase("cull"),
      };
    }
    if (photos.length && keeperCount > 0) {
      const st = activeJob?.status;
      if (st === "edit" || st === "send") {
        return {
          label: st === "send" ? "Send client link" : "Open Lightroom track",
          detail: `${keeperCount} keepers ready`,
          action: () => setPhase(st === "send" ? "gallery" : "edit"),
        };
      }
      return {
        label: "Open keepers in Lightroom",
        detail: `${keeperCount} keepers · ZIP + selects`,
        action: () => setPhase("edit"),
      };
    }
    if (activeJob && !photos.length) {
      return {
        label: "Import this shoot",
        detail: activeJob.name,
        action: () => inputRef.current?.click(),
      };
    }
    return {
      label: "Import tonight’s shoot",
      detail: "Folder or multi-select — stacks & scores start automatically",
      action: () => inputRef.current?.click(),
    };
  }, [photos.length, unsetCount, keeperCount, activeJob, setPhase]);

  if (!ready) {
    return (
      <div className="app">
        <header className="top">
          <div className="brand">
            Lens <span>OS</span>
          </div>
        </header>
        <main className="main">
          <p className="status">Opening studio…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          Lens <span>OS</span>
        </div>
        <nav className="nav">
          <button
            type="button"
            className={phase === "home" ? "active" : ""}
            onClick={() => setPhase("home")}
          >
            Home
          </button>
          <button
            type="button"
            className={phase === "jobs" ? "active" : ""}
            onClick={() => setPhase("jobs")}
          >
            Jobs
          </button>
          <button
            type="button"
            className={phase === "cull" ? "active" : ""}
            onClick={() => setPhase("cull")}
            disabled={!photos.length}
          >
            Pick
          </button>
          <button
            type="button"
            className={phase === "edit" ? "active" : ""}
            onClick={() => setPhase("edit")}
            disabled={!keeperCount}
          >
            Lightroom
          </button>
          <button
            type="button"
            className={phase === "gallery" ? "active" : ""}
            onClick={() => setPhase("gallery")}
            disabled={!keeperCount && !lastGallery}
          >
            Send
          </button>
        </nav>
      </header>

      {activeJob ? (
        <div className="job-strip">
          <span>
            <strong>{activeJob.name}</strong>
            {activeJob.lrPreset ? ` · ${activeJob.lrPreset}` : ""}
            {` · ${JOB_STATUS_LABELS[activeJob.status]}`}
          </span>
          <button
            type="button"
            className="btn"
            onClick={() => setPhase("jobs")}
          >
            Pipeline
          </button>
        </div>
      ) : null}

      <main className="main">
        {status ? <div className="status">{status}</div> : null}

        {phase === "home" && (
          <section className="hero">
            <h1>
              {photos.length
                ? sessionRestored
                  ? "You’re mid-shoot."
                  : "Tonight’s shoot."
                : "Finish the job tonight."}
            </h1>
            <p>
              Import → Pick → Lightroom → Send. One spine. Work survives
              refresh on this device.
            </p>

            <div className="stack-pills">
              <span>1 · Import</span>
              <span>2 · Pick</span>
              <span>3 · Lightroom</span>
              <span>4 · Send</span>
            </div>

            {photos.length > 0 ? (
              <div className="home-progress">
                <div className="home-progress-nums">
                  <span>
                    <strong>{stats.n}</strong> photos
                  </span>
                  <span>
                    <strong>{stats.k}</strong> keep
                  </span>
                  <span>
                    <strong>{stats.f}</strong> flag
                  </span>
                  <span>
                    <strong>{stats.r}</strong> reject
                  </span>
                  <span>
                    <strong>{unsetCount}</strong> open
                  </span>
                </div>
                <div className="capacity-bar" aria-hidden>
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${Math.round(
                        ((stats.k + stats.r + stats.f) /
                          Math.max(1, stats.n)) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="home-next">
              <button
                type="button"
                className="btn btn-primary home-next-btn"
                disabled={busy}
                onClick={nextStep.action}
              >
                {busy ? "Working…" : nextStep.label}
              </button>
              <p className="home-next-detail">{nextStep.detail}</p>
            </div>

            <div
              className={`drop${drag ? " drag" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                void onFiles(e.dataTransfer.files);
              }}
            >
              <strong>
                {busy
                  ? "Working…"
                  : photos.length
                    ? "Drop a new folder to replace this shoot"
                    : activeJob
                      ? `Drop ${activeJob.name}`
                      : "Or drop the card folder here"}
              </strong>
              <small>
                {activeJob
                  ? "Import attaches to the active job"
                  : "Optional: open Jobs first for year capacity"}
              </small>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              // @ts-expect-error webkitdirectory is non-standard but widely supported
              webkitdirectory=""
              hidden
              onChange={(e) => void onFiles(e.target.files)}
            />

            <div className="home-secondary">
              <button
                type="button"
                className="btn"
                onClick={() => setPhase("jobs")}
              >
                Jobs pipeline
              </button>
              {photos.length > 0 ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Clear this shoot from the device? Jobs and client galleries stay."
                      )
                    ) {
                      void clearShoot();
                    }
                  }}
                >
                  Clear shoot
                </button>
              ) : null}
              {keeperCount > 0 ? (
                <button
                  type="button"
                  className="btn"
                  onClick={() => setPhase("gallery")}
                >
                  Send gallery
                </button>
              ) : null}
            </div>
          </section>
        )}

        {phase === "jobs" && (
          <JobsBoard
            jobs={jobs}
            activeJobId={activeJobId}
            year={year}
            capacity={yearCapacity}
            busy={busy}
            onCapacityChange={(n) => void setYearCapacity(n)}
            onCreate={onCreateJob}
            onSelect={(j) => void selectJob(j.id)}
            onOpenActive={() =>
              setPhase(photos.length ? "cull" : "home")
            }
            onDelete={(id) => void removeJob(id)}
          />
        )}

        {phase === "cull" && (
          <section className="cull-stage">
            <p className="kb-hint">
              <kbd>K</kbd> keep · <kbd>R</kbd> reject · <kbd>F</kbd> flag ·{" "}
              <kbd>X</kbd> unset · <kbd>←→</kbd> · <kbd>Z</kbd> loupe ·{" "}
              <kbd>Space</kbd> toggle
              {autoAdvance ? " · auto-advance on" : ""}
              {activeJob ? (
                <>
                  {" "}
                  · <strong>{activeJob.name}</strong>
                </>
              ) : null}
              {" · saved here"}
            </p>

            <CullToolbar
              stats={stats}
              filter={filter}
              onFilterChange={setFilter}
              onAutoPick={autoPick}
              busy={busy}
              autoAdvance={autoAdvance}
              onAutoAdvanceChange={setAutoAdvance}
              onOpenLoupe={() => {
                if (selectedId || visibleIds[0]) {
                  if (!selectedId && visibleIds[0]) setSelectedId(visibleIds[0]);
                  setLoupeOpen(true);
                }
              }}
              extraActions={
                <>
                  <AdobeHandoffButton
                    count={keeperCount}
                    loading={busy}
                    className="btn btn-accent"
                    onClick={() => void runAdobeHandoff()}
                  />
                  <button
                    type="button"
                    className="btn"
                    disabled={!keeperCount}
                    onClick={() => setPhase("edit")}
                  >
                    Lightroom →
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={!keeperCount}
                    onClick={() => setPhase("gallery")}
                  >
                    Send →
                  </button>
                </>
              }
            />

            <StackStrip
              mates={stackMates}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onVerdict={setVerdict}
              onCompare={
                stackMates.length >= 2
                  ? () => {
                      setLoupeOpen(false);
                      setCompareOpen(true);
                    }
                  : undefined
              }
            />

            <CullGrid
              photos={visible}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onVerdict={setVerdict}
              stackHighlightId={stackHighlightId}
              stackSizes={stackSizes}
              onOpenLoupe={() => setLoupeOpen(true)}
            />

            {adobeHint ? <AdobeHintBox hint={adobeHint} /> : null}

            {loupeOpen && selectedPhoto ? (
              <CullLoupe
                photo={selectedPhoto}
                index={Math.max(0, visibleIds.indexOf(selectedPhoto.id))}
                total={visibleIds.length || photos.length}
                stackSize={stackSizes.get(selectedPhoto.stackId) || 1}
                onClose={() => setLoupeOpen(false)}
                onVerdict={setVerdict}
              />
            ) : null}

            {compareOpen && selectedId && stackMates.length >= 2 ? (
              <StackCompare
                mates={stackMates}
                leftId={selectedId}
                onSelect={setSelectedId}
                onVerdict={setVerdict}
                onClose={() => setCompareOpen(false)}
              />
            ) : null}
          </section>
        )}

        {phase === "edit" && (
          <EditPhase
            job={activeJob}
            keeperCount={keeperCount}
            busy={busy}
            adobeHint={adobeHint}
            lrPreset={lrPreset}
            editBrief={editBrief}
            onLrPresetChange={setLrPreset}
            onEditBriefChange={setEditBrief}
            onSaveBrief={() =>
              void updateActiveJobBrief(lrPreset, editBrief)
            }
            onHandoffAdobe={() => void runAdobeHandoff()}
            onExportSelects={exportSelectsPackage}
            onMarkEditDone={() => void markEditDone()}
            onGoSend={() => setPhase("gallery")}
          />
        )}

        {phase === "gallery" && (
          <section>
            <h2 style={{ marginTop: 0 }}>Client gallery</h2>
            <p style={{ color: "var(--soft)", maxWidth: "36rem" }}>
              One link. Favorites sync here. Survives reload.
            </p>

            <GalleryComposer
              title={title}
              message={message}
              pin={pin}
              photoCount={keeperCount || lastGallery?.photoIds.length || 0}
              busy={busy}
              onTitleChange={setTitle}
              onMessageChange={setMessage}
              onPinChange={setPin}
              onSubmit={async () => {
                try {
                  await createClientGallery(title, message, pin);
                } catch {
                  /* status already set in store */
                }
              }}
            />

            {shareUrl ? <SharePanel shareUrl={shareUrl} /> : null}
            {lastGallery ? (
              <PhotographerFavorites galleryId={lastGallery.id} />
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}

# LensOS Sports — V1 product plan

## The promise

LensOS Sports is the offline-first operating workspace for professional sports photographers working against a real deadline. It does not replace Lightroom or Photoshop. It makes the work before and after the edit faster, calmer, and traceable—so a photographer can deliver a first-quarter or final package today.

## The V1 loop

```text
Create event → ingest locally → review fast → caption + tag → send selects to Lightroom → package → deliver → record the job
```

The photographer remains in control at every decision point. LensOS can suggest and prepare; it never silently deletes, sends, or publishes.

## The six V1 systems

### 1. Event desk

One fast event record: sport, teams, date/time, venue, client, credential status, lighting notes, required packages, and delivery deadlines. It creates a checklist and a local project folder before arrival.

### 2. Local review engine

This is the product’s non-negotiable core.

- Ingest files locally and make previews available without a network.
- Group bursts; flag technically weak frames such as obvious blur or duplicates.
- Suggest peak-action frames, but never hide frames or make final selects.
- Preserve camera ratings plus the photographer’s star, color, and label decisions.
- Keyboard first: next/previous, keep/reject, star, color, flag, package.

**V1 boundary:** no automatic deletion. “Reject” means a reversible local flag.

### 3. Metadata desk

The event record pre-fills IPTC fields. Caption templates and hot-codes turn a repeated captioning job into fast review:

`[TEAM] player reacts after [MOMENT] during [EVENT] at [VENUE].`

LensOS proposes draft captions. The photographer accepts, changes, or bulk-rejects them.

### 4. Adobe bridge

“Send to Lightroom Classic” exports only the selected files and a sidecar manifest containing ratings, crops, captions, and keywords. “Bring back edited files” matches the returned output to the same LensOS project.

**V1 implementation note:** begin with a watched-folder/manifest bridge and Lightroom Classic plugin. Do not promise a cloud-only handoff.

### 5. Package desk

Packages are explicit, visible deadlines: `FIRST QUARTER`, `HALFTIME`, `FINAL`, `FULL GALLERY`. Each package has a select count, resolution preset, recipient, delivery status, and a final human-send confirmation. A delivery can route to a native link first; Pixieset handoff is a later connector unless its API/access terms support the exact workflow.

### 6. Job ledger

Every event has an income line, package/client, payment status, and linked expenses. The monthly view is intentionally a clean spreadsheet: money in, money out, and profit by job. CSV export is required in V1.

## Primary sports event flow

| Moment | Photographer action | LensOS action | Human confirmation |
| --- | --- | --- | --- |
| Before arrival | Creates `Knicks vs. Celtics` | Builds checklist, local folder, IPTC defaults, deadline packages | Event details |
| Card in | Chooses ingest | Makes local previews, groups bursts, preserves camera ratings | Start ingest |
| During game | Marks frames with keyboard | Keeps a live “send next” collection | Final picks |
| Break | Opens `HALFTIME` package | Prepares captions + export recipe | Send to Lightroom / deliver |
| After edit | Returns edited files | Matches them to selects and prepares output | Publish/send |
| After job | Adds payment/expense | Updates monthly ledger | Save |

## What must be offline

- Event setup, file ingest, previewing, culling/review, ratings, labels, packages, metadata templates, and export manifests.
- Cloud is optional for sync, delivery links, client records, and backup.

## Build order

1. Desktop event desk + local project format.
2. Fast local preview/culling engine and keyboard workflow.
3. Metadata templates + package queue.
4. Lightroom Classic bridge.
5. Delivery workflow and client log.
6. Ledger and CSV export.

## Success metric

Measure time from card ingest to a sent first package, not minutes spent “in the app.” The first V1 win is a photographer delivering a usable halftime/final set the same day with fewer apps and fewer manual handoffs.

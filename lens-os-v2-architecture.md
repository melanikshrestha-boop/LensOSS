# LensOS V2 — production workspace architecture

## Product decision

LensOS is an event-production operating system for high-volume sports photographers. The primary surface is the active Event Desk. Natural-language input remains available through a compact command palette, but it is no longer the product’s dominant interface.

The photographer owns taste, grading, approval, deletion, and publishing. LensOS prepares, organizes, validates, and moves the work.

## Agent charters reconciled

| Surface | Owner | Contract |
| --- | --- | --- |
| UI/UX system | A | Dense dark production shell, shared tokens, keyboard visibility, explicit states |
| Event Desk and ingest | B | Event context, local manifests, progressive preview indexing, review readiness |
| Local Review | C | Keyboard decisions, sequence grouping, comparison, reversible state |
| Metadata and captions | D | Event/template data, provenance, validation, explicit approval |
| Packages and delivery | E | Deadline sets, validation, export recipes, gallery, delivery receipt |
| Business layer | F | Real job economics, client/season views, traceable ledger entries |
| Adobe Bridge | G | XMP plus signed Lightroom Classic plug-in, collections, return manifests |

Every surface shares these rules:

- Originals are read-only.
- Reject means reversible soft reject, never deletion.
- Nothing publishes or delivers without explicit approval.
- The app remains useful offline.
- Event identity, next deadline, ingest/review progress, and local status remain visible.
- No fabricated event, package, client, or financial data appears in empty states.

## Information architecture

Persistent left navigation:

1. Event Desk
2. Review
3. Metadata
4. Packages
5. Delivery
6. Adobe Bridge
7. Clients
8. Business

Persistent event header:

- Event name and sport
- Venue, start time, and client
- Next deadline
- Local/offline status
- Add source and contextual action

Persistent right rail priority:

1. Next deadline and package readiness
2. Live workflow stages
3. Current-job economics
4. Adobe handoff state

`CommandPalette` opens with `Command/Ctrl + K`. It routes commands into production components; it does not create a second chat timeline.

## Core component structure

```text
AppFrame
├── NavigationRail
│   ├── EventSwitcher
│   ├── ProductionRoutes
│   └── LocalTrustState
├── EventWorkspace
│   ├── ActiveEventHeader
│   ├── ClientRequirementStrip
│   ├── PipelineStrip
│   └── ActiveSurface
│       ├── EventDesk
│       │   ├── SourceTray
│       │   ├── IngestMetrics
│       │   ├── QueueReadiness
│       │   └── DeadlinePackages
│       ├── ReviewWorkspace
│       │   ├── SequenceRail
│       │   ├── PreviewViewport
│       │   ├── Filmstrip
│       │   └── DecisionInspector
│       ├── MetadataDesk
│       ├── PackageDesk
│       └── DeliveryDesk
├── WorkflowRail
│   ├── DeadlineScoreboard
│   ├── WorkflowState
│   ├── JobScoreboard
│   └── AdobeBridgeStatus
└── CommandPalette
```

## State architecture

```text
NO_EVENT
→ EVENT_DRAFT
→ EVENT_READY
→ SOURCE_WAITING
→ SOURCE_PERMISSION
→ ENUMERATING
→ INDEXING_PREVIEWS
→ QUEUE_READY ─────────→ REVIEW_OPEN
     ├→ INDEXING_BACKGROUND
     ├→ COPYING_BACKGROUND
     └→ VERIFYING_BACKGROUND
→ INGEST_COMPLETE
→ METADATA_REVIEW
→ PACKAGE_READY
→ LIGHTROOM_HANDOFF
→ DELIVERY_APPROVAL
→ DELIVERED
```

Recoverable ingest branches include source removal, permission loss, low disk space, unsupported files, corrupt previews, duplicate detection, and copy failure. Completed manifest work and review decisions persist through recovery.

## Local Review interaction contract

Default shortcuts:

| Key | Action |
| --- | --- |
| Left/Right or J/K | Previous/next image |
| P | Pick |
| X | Soft reject |
| U | Clear decision |
| 1–5 | Star rating |
| Q | Toggle active package |
| C | Compare |
| G | Grid |
| Command/Ctrl + Z | Undo |
| ? | Shortcut map |

Review decisions are journaled locally and attached to a stable LensOS asset ID. Sequence grouping may use camera identity, normalized capture time, burst interval, and visual continuity. Suggested peak frames can be surfaced first, but the queue freezes when review begins and every photograph remains discoverable.

## Metadata and caption contract

- Ingest preserves an immutable snapshot of existing EXIF/IPTC/XMP.
- Event data and client/league templates create drafts.
- Player/jersey identification remains a suggestion until accepted.
- Each field records provenance: original, event, template, detection, accepted suggestion, or manual.
- Batch apply shows the image count, changed fields, conflicts, and before/after examples.
- Approved data is written atomically to XMP sidecars; RAW bytes never change.
- Changed-after-approval captions must be approved again before delivery.

## Package and delivery contract

Package lifecycle:

```text
PLANNED → SELECTING → SELECTS_READY → IN_LIGHTROOM
→ EDITS_RETURNING → METADATA_CHECK → EXPORT_READY
→ AWAITING_APPROVAL → EXPORTING → UPLOADING → DELIVERED
```

Each package owns a deadline, target count, caption/IPTC requirements, export preset, destination, recipient, and delivery state. Delivery requires a final confirmation showing recipient, destination, file count, and preset. A completed delivery emits one idempotent receipt and one ledger event. A corrected delivery creates a new revision rather than rewriting history.

## Adobe Bridge contract

V1 uses a signed Lightroom Classic Lua plug-in plus an XMP/manifest bridge.

- LensOS writes XMP for ratings, labels, IPTC, captions, copyright, and keywords.
- A LensOS manifest transfers pick/reject state, asset IDs, paths, revisions, and package membership.
- The plug-in creates one Lightroom collection set per event and one collection per package.
- LensOS never edits `.lrcat` directly.
- Lightroom becomes authoritative for Develop settings and crop after handoff.
- Lightroom exports return with asset IDs and package IDs; nothing is published automatically.
- Conflicts are field-level and never silently overwritten.

## Business contract

Creating an event creates a linked draft job with no fabricated revenue. Production actions automatically capture ingest counts, active work time, review count, selection rate, Lightroom handoff, package delivery, and turnaround. Revenue, costs, invoices, and payments remain explicitly entered or imported with source provenance.

The active-event scoreboard distinguishes:

- Agreed revenue
- Invoiced revenue
- Collected cash
- Estimated costs
- Actual costs
- Projected profit
- Actual profit
- Active work time
- Profit per work hour

Unknown values show an action such as `Add revenue`; they never silently become zero.

## Performance truth

The browser prototype can demonstrate the state model, file enumeration, queue controls, and decision journaling. Reliable mounted-card detection, embedded RAW preview extraction, EXIF parsing, background copy/verification, and 4,000–10,000-file performance require a desktop application or native local helper.

Target baseline:

- Source acknowledgement under 250 ms
- First live file count under 1 second
- First thumbnail under 2 seconds
- First 12 reviewable previews under 3 seconds
- First 60 reviewable previews under 7 seconds
- Review enabled under 10 seconds median and 15 seconds p95
- Cached image navigation under 50 ms p95
- Keyboard acknowledgement under 35 ms p95
- No main-thread task longer than 100 ms during ingest

“Queue ready” means real embedded previews can be reviewed and rated. Counting filenames does not satisfy the target.

## Beta build order

1. Native/local asset manifest and embedded-preview pipeline
2. Virtualized Local Review with durable keyboard decisions
3. Event and client requirements with metadata templates
4. XMP/Lightroom Classic handoff and return manifest
5. Deadline package validation and delivery receipts
6. Client gallery and feedback
7. Automatic job economics and season/client views

## Acceptance gate

The beta is not ready until a photographer can:

1. Create an event or attach a source in two actions.
2. Begin reviewing real previews while indexing continues.
3. Complete at least 95% of culling actions without a mouse.
4. Restart and return to the exact image, queue, package, and decision state.
5. Send correct ratings, metadata, and package collections to Lightroom without moving originals.
6. Receive edited returns into the correct package.
7. Validate and explicitly approve delivery.
8. See job economics traceable to real ledger entries.


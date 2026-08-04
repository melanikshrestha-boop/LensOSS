# Lens — V1 Product (greenfield)

## One-liner
**Cull like Aftershoot. Deliver like Pixieset. Edit in Lightroom when you need craft.**

## Who pays (personas)
1. **Wedding / event volume** — 20–40+ jobs/year, time savings + predictable cost  
2. **Lightroom-native** — bottleneck is consistent high-quality editing, not selection volume  

See `docs/PERSONAS.md`.

## Spine
```
Job → Import → Pick (cull) → Lightroom (edit) → Send (client gallery)
```

Non-bubble words. No SaaS maze.

## Beta focus (current)
**A-level Pick (cull) is the product.** First beta wins or loses on how fast a tired photographer can get keepers after dumping a card.

Beta bar for cull:
- Keyboard-first (K/R/F/X, arrows, Z loupe, Space toggle)
- Auto-advance after verdict (Photo Mechanic speed)
- Near-dupe stacks (name + burst time) + stack strip + **Win**
- Technical score + soft flag + auto-pick first pass
- Loupe full-frame review
- Session survives reload
- Dense grid; filters for open/keep/flag/reject/stacks

Gallery, jobs, LR handoff stay available — **not** the beta headline.

## V1 ambitious features (ship this bar)

| Feature | Job | Done means |
|---------|-----|------------|
| **Local import** | Folder / multi-file drop into the studio | Drag-drop + file picker; scores & stacks kick off |
| **Keyboard cull** | Fast keep / reject / flag without hunting buttons | Arrow keys + hotkeys for verdicts; grid stays snappy |
| **Stack + score** | Near-dupe stacks + technical score (sharpness proxy) | Soft/closed-eye-style soft flags; stack grouping; 0–1 score |
| **Auto-pick** | First pass keepers from scores | Threshold keep/reject; human can override every frame |
| **ZIP Adobe handoff** | Export keepers for Lightroom / Photoshop | Preferred: one **ZIP** of keepers + clear LR import steps; file fallback if needed |
| **Durable client gallery (IDB)** | Shareable client view that **survives reload** | IndexedDB via `idb-keyval`; real image blobs — **not** dead `blob:` URLs |
| **PIN favorites** | Optional gallery PIN + client favorites | PIN gate on `?g=` link; client can heart keepers; photographer sees favorites later |
| **Jobs pipeline** | 20–40 jobs/year capacity for wedding/event | Named jobs, type, date, status Import→Pick→LR→Send→Done, annual capacity meter |
| **LR edit track** | Consistent quality for people who live in LR | Per-job preset + brief, keepers ZIP, selects CSV, edit checklist, mark edits done |

### Module map

| Module | Job | Not V1 |
|--------|-----|--------|
| **Jobs** | Year pipeline + capacity for volume shooters | CRM, contracts, invoicing |
| **Import** | Folder / multi-file local | Cloud sync, tethered capture |
| **Pick (cull)** | Stacks, scores, keyboard keep/reject/flag, auto-pick | Full Aftershoot ML parity, face-cluster training |
| **Lightroom** | ZIP keepers + selects CSV + edit brief; craft in LR | Round-trip XMP, in-app develop, train-your-style AI edit |
| **Send (gallery)** | Shareable `?g=` link, durable IDB previews, PIN, favorites | Payments, print store, client upload requests |
| **Account** | Local-first; waitlist-ready copy | Full SaaS billing |

## Why this wins the “create vs business” war
- Post black hole → **cull first** (keyboard + stacks)  
- Client chaos → **one gallery** that still works after refresh  
- Subscription tax → **one app for cull+send**, Adobe only for craft  
- Non-bubble humans → **four words**: Import, Pick, Adobe, Send  

## Product laws
1. **Lens owns cull + send.** Adobe owns craft.  
2. **Never wipe** galleries / IDB / user work without explicit order.  
3. **Daily ship** — vertical slices, not multi-week freezes.  
4. Calm UI. Power under the hood. No divider-line addiction.

## Agents
Who owns what: `docs/AGENTS.md`.  
How agents work: `CLAUDE.md`.  
Stack tax research: `docs/SUBSCRIPTIONS.md`.

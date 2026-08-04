# Lens — How Agents Work Here

## Product
**Company home:** `melanikshrestha-boop/LensOSS` monorepo. This tree is `app/`.

**Lens** — photographer OS for people **outside the software bubble**.  
Cull like Aftershoot. Deliver like Pixieset. Edit in Adobe when you need power.

**Spine (four words):**
```
Import → Pick (cull) → Adobe (keepers) → Send (client gallery)
```

Repo: `/Users/melanishrestha/Projects/LensOSS/app`  
Local: `npm run dev` → **http://127.0.0.1:5173/**  
This is a **greenfield** scrap of old `lens-os`. Prefer this tree for new work.

## Daily ship law (non-negotiable)
1. **Every calendar day** ends with a **real, user-visible** change on origin (or an explicit blocked note).
2. Prefer **one vertical slice** over five half-wired menus.
3. After real feature work: spawn **`lensoss-push`** (or lens-push if dual-tracking) (commit + push). Same energy as `celine-push`.
4. **Never wipe** shoots, galleries, IndexedDB client data, or local state without Melani’s explicit order.
5. New commits over history rewrites. **Never force-push** `main` unless she ordered it. Never `git reset --hard` shared work.

## Engineering bar (elite)
Work at the level of a top lab + first-principles systems builder. **No AI slop.**

- **Correctness first.** Edge cases before typing. Empty import, one photo, huge folder, offline, double-click, dead object URLs.
- After changes: run what you can (`npm run build`, `npm run lint`, manual smoke at :5173). Fix failures before “done.”
- Do not “simplify” by deleting features, data, or spine steps.
- Photographers are not engineers — UI stays simple; power stays under the hood.
- Name things precisely. Types where the stack supports them. No mystery globals. No half-wired buttons.
- If you don’t know something, **verify** (read code, run it). Do not invent APIs.

### Anti-slop checklist
1. What exactly am I changing, and what must keep working?
2. Simplest design that still wins long-term?
3. Hostile path / empty state / offline / double-click covered?
4. Would I merge this at a top company, or is it demo glue?
5. Repo cleaner than I found it (no dead code, no TODO lies)?

## File ownership (from `docs/AGENTS.md`)
Parent agent orchestrates. Children **do not stomp** the same files.

| Agent | Owns |
|-------|------|
| **lens-core** | Import, project store, types, routing shell |
| **lens-cull** | Stacking, scores, cull grid UX |
| **lens-gallery** | Client share, favorites, PIN, durable gallery IDB |
| **lens-adobe** | Export keepers (ZIP), open LR/Finder guidance |
| **lens-copy** | Landing, empty states, non-bubble words |
| **lens-push** | Commit + push after features |
| **pr-reviewer** | Pre-merge sanity |

**Parent wires `src/App.tsx`** (and top-level routing / composition). Feature agents own their modules; parent integrates.

### Boundaries (avoid stomps)
- `src/features/import/**` — core  
- `src/features/cull/**` — cull only  
- `src/features/gallery/**` — gallery only  
- `src/features/adobe/**` — adobe only  
- `src/lib/**` — shared types/engines (coordinate with owner before drive-by edits)  
- `src/pages/**` / shell — parent / core  
- **docs only:** `docs/**`, `README.md`, `CLAUDE.md`, `.grok/skills/**` — **lens-docs**

## Product position (don’t fight Adobe)
- Lens owns **cull + send**.
- **Adobe** owns deep craft (Lightroom / Photoshop) via honest handoff (ZIP keepers + import steps).
- Do not build a third full editor in V1. Do not pretend we replaced Adobe.

## Data safety
- Client galleries live in **IndexedDB** (`idb-keyval`). Treat as user data.
- Never clear IDB, wipe galleries, or delete photo blobs “for cleanup” without order.
- Never commit `.env` secrets, credentials, or large private shoot dumps.

## Stack (current truth)
- Vite + React + TypeScript
- Zustand (session state)
- `idb-keyval` (durable galleries)
- Local-first; no required backend for V1 cull/send loop

## Docs map
- `docs/PRODUCT.md` — V1 features & spine  
- `docs/SUBSCRIPTIONS.md` — photographer stack tax  
- `docs/AGENTS.md` — spawn rules & file boundaries  
- `.grok/skills/lens-push/SKILL.md` — ship protocol  

## What NOT to do
- Don’t broaden into full Aftershoot Edit / train-your-style AI until cull+send is loved.
- Don’t add billing until gallery+cull loop is loved.
- Don’t fight Celine Nova ports — this app is **5173**, not 3000/3847.
- Don’t touch `src/**` if you are **lens-docs** (docs-only agent).
- Don’t declare victory with untested code.

## Design law (site + product)
- **No structural divider lines** — spacing/type/surface contrast. Interactive borders only (focus, selected photo, safety). See `docs/DESIGN_RULES.md`.
- Marketing primary: `site/` (Codex vertical OS). Product app: Vite `npm run dev` :5173.

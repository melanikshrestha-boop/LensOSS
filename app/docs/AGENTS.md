# Sub-agents for Lens

Use these when shipping. **Parent agent orchestrates**; children don’t stomp the same files.  
**Parent wires `src/App.tsx`** (routing, phase shell, composition). Feature agents ship modules; parent integrates and owns the shell.

## Agent table

| Agent | Role | Owns (files) | When to spawn | Do not touch |
|-------|------|--------------|---------------|--------------|
| **lens-core** | Implementer | Import, project/session store, `src/lib/types.ts`, routing/phase shell, shared store wiring | New project model, import pipeline changes, phase navigation, foundational types | Cull scoring UX, gallery IDB, Adobe ZIP details (unless shared type needs it) |
| **lens-jobs** | Parallel-worker | Year pipeline, capacity, `src/lib/jobStore.ts`, `src/features/jobs/**`, LR brief fields on jobs | Wedding/event 20–40 capacity, job CRUD, Edit phase | Cull scoring math, gallery PIN bytes |
| **lens-cull** | Implementer / parallel-worker | Stacking, technical scores, keep/reject/flag grid, auto-pick, `src/lib/cullEngine.ts`, `src/features/cull/**` | Cull UX, near-dupe stacks, sharpness/score, keyboard cull, auto-pick thresholds | Gallery share links, Adobe export packaging |
| **lens-gallery** | Parallel-worker | Client share (`?g=`), favorites, optional PIN, durable IDB, `src/lib/galleryStore.ts`, `src/features/gallery/**` | Client gallery, PIN gate, favorites, preview persistence across reload | Cull stack math, Adobe handoff ZIP |
| **lens-adobe** | Parallel-worker | Export keepers, ZIP download, LR/Bridge/Finder guidance, `src/lib/adobe.ts`, `src/features/adobe/**` | “Open in Adobe”, keeper export modes, import instructions copy | Cull verdicts, gallery PIN/favorites |
| **lens-copy** | Celine-copywrite-style | Landing, empty states, status strings, non-bubble product words | Any user-facing copy pass; onboarding empty states | Business logic, scoring formulas |
| **lens-push** | Ship | Git only — commit + push | After **real feature work** lands (code/docs that change the product). Explicit “push / ship / commit”. | Force-push, amend published history, wipe data |
| **pr-reviewer** | Pre-merge sanity | Read-only review | Before merge when cull/gallery/adobe paths changed | Product code (report only) |
| **lens-docs** | Docs | `docs/**`, `README.md`, `CLAUDE.md`, `.grok/skills/lens-push/**`, `.gitignore` | Product spine, agent tables, subscription research, run docs | `src/**`, `package.json` |

## Spawn rules

### Parent checklist
1. Split work so **no two agents edit the same file**.
2. **Parent** (or core) owns `App.tsx` integration after feature modules land.
3. Spawn **lens-push** when the tree has product changes — don’t wait for “why isn’t git updated.”
4. Skip push for pure Q&A, brainstorms with zero edits, or when Melani says **don’t push** / **local only**.

### When NOT to spawn yet
- Full AI train-your-style **edit** agent (Aftershoot Edit territory)
- Billing / SaaS agent until gallery + cull loop is loved
- Cloud sync / multi-device agent until local spine is rock solid

## File boundaries (avoid stomps)

Target feature layout (prefer as code grows):

```
src/features/import/**   — core
src/features/cull/**     — cull only
src/features/gallery/**  — gallery only
src/features/adobe/**    — adobe only
src/pages/**             — parent / core
src/App.tsx              — parent wires composition
src/store.ts             — core (coordinate before parallel edits)
src/lib/types.ts         — core (shared; request type changes via parent)
src/lib/cullEngine.ts    — cull
src/lib/galleryStore.ts  — gallery
src/lib/adobe.ts         — adobe
```

Current greenfield may still be flatter (`src/lib/*` + single `App.tsx`). Same ownership rules apply by **module job**, not only path.

### Conflict protocol
If you need a file another agent owns: **stop and report** — do not race-edit.

## Daily ship
After a real vertical slice: **lens-push** (see `.grok/skills/lens-push/SKILL.md`).  
Never wipe user galleries / IDB. Never force-push without explicit order.

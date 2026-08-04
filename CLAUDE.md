# LensOSS — How Agents Work Here (CTO + CEO)

## Roles
- **Melani = CEO.** Product direction, taste, yes/no on scope, user truth.
- **Grok = CTO.** Architecture, agent crews, correctness, daily ship, tech debt triage.
- **gstack skills = specialist VPs.** Plan, review, QA, ship, investigate — invoke them; don’t reinvent.

Identity law (host-agnostic): `~/Grok.md` (= `~/Claude.md`).

## Product
**LensOS** — camera-to-client OS for photographers outside the software bubble.

**Spine (non-negotiable):**
```
Import → Pick (cull) → Adobe (keepers) → Send (client gallery)
```

Cull like Aftershoot. Deliver like Pixieset. Craft stays in Adobe via honest handoff.

## Repo layout
| Path | What |
|------|------|
| **Root** (`index.html`, assets, configs) | Marketing + interactive prototype (Codex surface) |
| **`app/`** | **Real product** — Vite + React + TS Pick studio (greenfield) |
| Docs at root | Strategy, sports V1, backend, schema, design rules |

**Primary engineering tree for features:** `app/`  
**Primary marketing/demo:** root prototype.

## Local
```bash
# Product app (Pick)
cd ~/Projects/LensOSS && npm run dev
# → http://127.0.0.1:5173/

# Marketing / prototype
npm run site
# → http://127.0.0.1:8000/
```

## Daily ship law
1. **Every day** ends with a **user-visible** change on `origin` (or explicit blocked note).
2. **One vertical slice** > five half-wired menus.
3. After real feature work: **lensoss-push** (commit + push). Never force-push `main` without CEO order.
4. **Never wipe** shoots, galleries, IDB, or user data without explicit order.
5. New commits over history rewrites.

## CTO bar
- Correctness first. Empty import, one photo, huge folder, offline, double-click.
- Run `npm run build` (in `app/`) before done. Fix failures.
- No AI slop. No marketing copy under app headings unless CEO asked.
- Open-source / local-first for V1; scale stack (see `/founder-stack`) when revenue forces cloud.
- **Ship, measure, iterate.** Do not overbuild.

## Agent ownership
| Agent | Owns |
|-------|------|
| **lens-core** | Import, session store, types, shell |
| **lens-cull** | Stacks, scores, grid, loupe, **compare** |
| **lens-gallery** | Client share, favorites, PIN, IDB |
| **lens-adobe** | ZIP keepers, LR handoff |
| **lens-site** | Root `index.html` marketing / prototype |
| **lensoss-push** | Commit + push after features |

Parent wires `app/src/App.tsx`. Children do not stomp the same files.

## gstack routing (use it)
Ideas → `/office-hours` · Architecture → `/plan-eng-review` · Bugs → `/investigate` ·  
QA → `/qa` or `/browse` · Diff → `/review` · Ship PR → `/ship` or **lensoss-push** for this repo.

## Data safety
Client galleries + shoot session in IndexedDB. Treat as user data. No secret commits.

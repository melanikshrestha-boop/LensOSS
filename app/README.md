# Lens

**Cull like Aftershoot. Deliver like Pixieset. Edit in Adobe.**

Photographer OS — greenfield V1. Owns **cull + send**. Deep craft stays in Lightroom/Photoshop via honest handoff.

## Spine

```
┌─────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ Import  │ →  │ Pick (cull)  │ →  │ Adobe (keepers) │ →  │ Send (gallery)   │
│ folder  │    │ stacks+score │    │ ZIP + LR steps  │    │ IDB · PIN · ♥    │
└─────────┘    └──────────────┘    └─────────────────┘    └──────────────────┘
```

Replaces the multi-subscription spaghetti (Photo Mechanic / Aftershoot + Adobe + Pixieset) for the **cull + send** layers. You keep Adobe for craft.

## Run

```bash
cd ~/Projects/lens
npm install
npm run dev
# → http://127.0.0.1:5173
```

| Command | What |
|---------|------|
| `npm run dev` | Vite dev server (port **5173**) |
| `npm run build` | Typecheck + production build |
| `npm run lint` | oxlint |
| `npm run preview` | Preview production build |

## V1 features
- Local import (folder / multi-file)
- Near-dupe **stacks** + technical **score** + auto-pick
- Keep / reject / flag grid (**keyboard cull**)
- **Open in Adobe** — ZIP keepers + Lightroom import guidance
- **Client gallery** — shareable `?g=` link, durable **IndexedDB** previews, optional **PIN**, client **favorites**

## Not V1
Full Aftershoot ML edit, print stores, billing, cloud sync.

## Docs
| File | Contents |
|------|----------|
| [`CLAUDE.md`](./CLAUDE.md) | How agents work on this repo |
| [`docs/PRODUCT.md`](./docs/PRODUCT.md) | Product spine & V1 bar |
| [`docs/SUBSCRIPTIONS.md`](./docs/SUBSCRIPTIONS.md) | Photographer stack tax |
| [`docs/AGENTS.md`](./docs/AGENTS.md) | Sub-agents & file ownership |

## Ship law
After real feature work: run **`/lens-push`** (commit + push). Never wipe user gallery data. Never force-push without explicit order.

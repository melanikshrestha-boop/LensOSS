# LensOS

Camera-to-client OS for photographers and media teams.

**Tagline:** Your turnaround date is tonight.

**Spine:** Import → Pick (cull) → Adobe (keepers) → Send (gallery)

## Repo layout

| Path | Role |
|------|------|
| `app/` | **Product** — Vite + React Pick studio |
| Root (`index.html`, …) | Marketing / interactive prototype |
| `CLAUDE.md` | Agent + CEO/CTO law |
| `DAILY.md` / `SHIP_LOG.md` | Daily ship rhythm |

## Local

```bash
# Product (Pick)
cd ~/Projects/LensOSS
npm install --prefix app   # first time
npm run dev
# → http://127.0.0.1:5173/

# Prototype / marketing
npm run site
# → http://127.0.0.1:8000/
```

## Configuration (prototype)

Auth/analytics stay off until public values are set in:

- `auth-config.js`
- `analytics-config.js`

Never commit private service keys.

## Status

- **Pick app** ships real cull (keyboard, loupe, stacks, 2-up compare).
- Root prototype is the vertical-OS story and research surface.
- Production cloud auth, analytics, and multi-machine storage are staged — not day-one blockers.

## Ship law

User-visible progress every day. Agents: see `CLAUDE.md`.

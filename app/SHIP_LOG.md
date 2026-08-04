# Lens OS — Ship Log

Newest first.

---

## 2026-08-04 — Codex vertical OS marketing → greenfield site
**Target:** Ship yesterday/today Codex LensOS work into `~/Projects/lens` — no more orphan Documents folder.
**Shipped:**
- Primary `site/index.html` = full Codex vertical OS landing + survey + Event Desk + workspace prototype (~380KB single-file product surface)
- `auth-config.js`, `analytics-config.js`, `design-memory.js` (public placeholders only — no secrets)
- Asset `assets/lensos-court-v1.png`
- Design law: `site/DESIGN_RULES.md` + `docs/DESIGN_RULES.md` (no structural dividers)
- Strategy docs under `docs/codex-2026-08/` (architecture, sports V1, beta/auth, supabase schema)
- Archived prior premium marketing → `site/archive-premium-2026-08-02/`
- Nav **Open studio →** → `http://127.0.0.1:5173/` (Vite Pick app)

**Done when:** `npm run site` → http://127.0.0.1:5199/ shows Codex work; React app still builds.
**Verify:** site 200 + asset 200; `npm run build` green.
**Next:** Wire survey → real waitlist/backend when ready; keep Pick (cull) as beta headline in app.

---

---

## 2026-08-02 — Marketing redesign (premium + original)
**Target:** Kill ugly Later-clone. Premium motion + early Lens voice. Don’t get sued.  
**Shipped:**
- Full rewrite of `site/` — dark stage, Instrument Serif, gold accent  
- Scroll reveals + sticky nav (`motion.js`)  
- Early-Lens copy (create vs pile, versions A/B/C waitlist)  
- Abstract product mock only — **no competitor assets/screenshots**  
- Footer legal + `site/LEGAL.md` (independent product; Adobe name = handoff only)  

**Done when:** Site feels calm/premium; clearly not an Aftershoot clone.  
**Open:** `http://127.0.0.1:5199/`  

---

## 2026-08-02 — Marketing site (Later-style)
**Target:** Motivation landing — Later.com trial energy for Lens.  
**Shipped:**
- `site/index.html` + `site/styles.css` — hero, product mock, how-it-works, bands, pricing, waitlist  
- Violet CTA / airy white SaaS layout inspired by Later  
- Local waitlist → `localStorage`  
- Open: `http://127.0.0.1:5199/`  

**Done when:** Melani can open a real marketing page and feel the product.  
**Next:** Real product screenshots when cull UI is proud; waitlist → server.  

---

## 2026-08-02 — Cull actually works (previews · scores · stacks)
**Target:** Fix black-? grid, fake score 41, mega-stacks, slow full-res path.  
**Shipped:**
- Thumb pipeline (~360px JPEG) for grid/loupe — not full files  
- Honest scores: `null` when decode fails (never invent 0.41)  
- Burst stacks only: same stem + ≤450ms + size band + **max 8**  
- RAW/HEIC fail state with plain copy, not broken image icons  
- Original `File` kept in memory for full-res Adobe ZIP  
- Session IDB = thumbs only; import progress `N/total`  
- Status: “X previews · Y couldn’t decode (Z RAW)”  

**Done when:** Re-import a JPEG folder → real photos, varied scores, sane stacks.  
**Next:** Virtualized grid if 1k+ still janky; HEIC decode path if needed.  

---

## 2026-08-02 — A-level cull beta (headline product)
**Target:** First beta = elite Pick — Photo Mechanic speed + Aftershoot-style stacks.  
**Shipped:**
- Auto-advance after K/R/F/X (toggle in toolbar)
- Loupe full-frame review (**Z** / Enter / double-click; Esc closes)
- Stack strip + **Win** (keep winner, reject mates)
- Stack badges on grid; denser grid; sticky toolbar
- Burst restack by time proximity (~1.8s + size) in `cullEngine`
- Filters: Open / Keep / Flag / Reject / Stacks + % decided
- Keyboard: X/U unset; selection scroll-into-view
- Product docs: beta focus = cull first  

**Done when:** Photographer can dump a folder and rip through keepers with only keyboard.  
**Next:** Compare 2-up in stack; maybe reject-all-below-score; 1k+ grid perf pass.  

---

## 2026-08-02 — Durable shoot session + Home next-step
**Target:** Ground-up reliability — cull work survives reload; Home shows one next action.  
**Shipped:**
- `src/lib/sessionStore.ts` — IDB session (photo blobs + verdicts + scores + job + phase)
- Store: `hydrate()`, debounced `persistNow`, `clearShoot`, revoke object URLs
- Home: progress bar + primary CTA (Continue pick / LR / Import) — persona marketing cards removed
- Cull hint: “saved on this device”
- `DAILY.md` + this log for greenfield rhythm  

**Done when:** Import → pick → refresh → same photos & verdicts still there.  
**Next:** Stack UI polish (expand stack mates) or gallery favorites push-back polish.  

---

## Prior (pre-log)
- Greenfield V1: cull, Adobe ZIP, durable client gallery, jobs pipeline, LR edit track  
- See git history on `main`.

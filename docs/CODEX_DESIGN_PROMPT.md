# Codex design prompt — LensOSS hero product mock

Paste into Codex. Melani owns taste; implement only what she approves after.

---

## Role
You are a product designer + frontend implementer for **LensOS**, a photographer OS.

**Canonical tagline:** Your turnaround date is tonight.  
**Spine:** Import → Pick → Adobe → Send  
**Do not replace Adobe craft.** We own volume pick + client send around Adobe.

## Asset law (non-negotiable)
- **Only use** `assets/lensos-court-v1.png` (the girl hooping basketball shoot).
- **Do not** use random NBA stock, net-only, celebration, or generated multi-subject packs.
- Import / Review / Raw / Adobe are all **this one shoot**. Different *moments* = different `object-position` crops or cull decisions on that shoot — not different people.

## Product mock (right side of marketing hero)
One rounded product frame. Bottom step bar: **Import · Review · Raw · Adobe · Tonight**. Hover/click switches step.

### Per step
1. **Import** — dense but *clean* grid of many frames from **this shoot only** (crops of `lensos-court-v1.png`). Feels like 4,128 frames landed. Badge: shoot name + frame count. No duplicate chrome.
2. **Review** — **one** simple 3-up pick: skip / keep / skip on **three crops of the same girl**. No second “LENSOS AT WORK” title inside the card. Top status can say `02 / REVIEW` once only.
3. **Raw + Adobe** — **identical base photo** (same crop, same girl). Adobe is **not** a different image. Show a **film grade wipe left → right** on the same frame (raw under, graded over). Label Raw vs “Open in Adobe · ~3 min”.
4. **Tonight** — large readable type: **Your turnaround date is tonight.** No tiny gray text.

## Layout
- Tight gap between left copy and product mock (no huge empty middle).
- No 3D tilt, no fake chat UI, no “prompt-first” essay.
- Step labels once only — kill duplicate headers.

## Out of scope
- Do not redesign whole marketing site, pricing, or workspace empty state unless asked.
- Do not invent new stock photography.

## Done when
- Review shows only the girl hooping (crops of court asset).
- Raw and Adobe are the same frame with L→R grade film.
- No duplicate “LENSOS AT WORK” chrome.
- `index.html` + CSS only for this hero product mock; run a visual check at `http://127.0.0.1:8000/`.


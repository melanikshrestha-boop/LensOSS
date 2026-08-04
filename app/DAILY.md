# Lens OS — Daily Operating Rhythm

## Cadence
| When | What |
|------|------|
| Start of day | Open `DAILY.md` + last `SHIP_LOG` entry. Pick **one** ship target. |
| Build block | Implement only that target. No drive-by refactors. |
| End of day | User can feel it → **lens-push** → log in `SHIP_LOG.md`. |

## Ship target format
```
Day: YYYY-MM-DD
Target: <one sentence>
Done when: <photographer can …>
Out of scope: <what we refuse today>
```

## This week’s spine — **BETA = A-level cull**
1. **Pick (cull)** — keyboard, loupe, stacks, auto-advance, scores ← **headline**  
2. **Import + durable session** — folder in; work survives reload  
3. **Lightroom handoff** — ZIP keepers (secondary until cull is loved)  
4. **Send** — client gallery (secondary)  
5. **Jobs** — year capacity (secondary)  

## Port
```bash
cd ~/Projects/lens
npm run dev
# → http://127.0.0.1:5173/
```

## Ground up
Clean spine + daily visible progress. Not a silent multi-week rewrite freeze.  
Repo truth: this greenfield tree (`~/Projects/lens`), not legacy `lens-os`.

## Today — 2026-08-04
```
Day: 2026-08-04
Target: Land Codex LensOS site work into greenfield and push origin
Done when: site:5199 shows yesterday's product surface; origin has the commit
Out of scope: full Supabase live keys; multi-day sports Event Desk backend
```

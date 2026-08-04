# LensOS Builder System

LensOS is a camera-to-client operating system for photographers and media teams. Build it like a professional creative tool, not a generic dashboard.

## Operating loop

Use this sequence for meaningful work:

1. Think: identify the user pain and challenge the requested framing.
2. Plan: lock scope, data flow, failure paths, and the visible outcome.
3. Build: complete one usable vertical slice.
4. Review: inspect the diff for product, design, engineering, and security failures.
5. Test: use the real interface with realistic media and verify the rendered result.
6. Ship: commit intentional files, push safely, and verify the deployed URL.
7. Reflect: record durable decisions and project-specific lessons.

## gstack routing

Use the installed gstack skill that matches the request:

- Product idea or vague feature: `office-hours`
- Strategy and scope: `plan-ceo-review`
- Architecture and failure paths: `plan-eng-review`
- Design system or design plan: `design-consultation` or `plan-design-review`
- Full plan review: `autoplan`
- Bug or broken behavior: `investigate`
- Live product testing: `qa` or `qa-only`
- Diff review: `review`
- Visual polish: `design-review`
- Shipping or deployment: `ship` or `land-and-deploy`
- Save or restore working state: `context-save` or `context-restore`

## Product judgment

- Search before building unfamiliar infrastructure or media-processing systems.
- Prefer the complete relevant solution over a shortcut. Work one finished lake at a time.
- The user decides. Recommendations never override explicit product or taste direction.
- Tie every technical decision to what the photographer sees, waits for, controls, saves, or earns.
- Fix root causes. Do not patch the screenshot while leaving the interaction broken.
- Never call a prototype production-ready when its culling, editing, storage, authentication, analytics, or Adobe handoff is simulated.

## LensOS interface rules

- Never use structural divider lines. Create hierarchy with spacing, typography, alignment, and subtle surface contrast.
- Keep outlines for interactive boundaries, focus, selected media, and safety states only.
- Do not add subtitles, helper copy, or explanatory paragraphs by default.
- Use short, self-explanatory labels. Remove buzzwords and repeated meaning.
- Do not use em dashes in interface copy.
- Keep the workspace calm. Hide controls until they are relevant.
- Preserve original media. Any removal, edit, or automated recommendation must be reversible.
- AI assists the workflow. The photographer makes the creative decision.

## Visual completion gate

A visual change is complete only after all of these are true:

- The page was rendered at the actual local or deployed URL.
- Desktop and narrow layouts were inspected.
- Primary interactions were exercised.
- Console errors were checked.
- The result matches the requested focal element before secondary motion or decoration is added.

Source checks, HTTP 200, lint, and type checks are necessary evidence, not visual approval.

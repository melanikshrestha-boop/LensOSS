# LensOS beta backend

## Recommendation

Use **Supabase + Inngest + OpenAI Responses API**.

- **Supabase** is the source of truth: Google/Apple/email sign-in, Postgres database, file storage, and each studio's private data.
- **Inngest** runs durable background workflows: a large upload, client selection, or edit request can continue, retry, and report progress without holding up the app.
- **OpenAI Responses API** is the reasoning layer that turns a photographer's language into a safe, structured job plan.

This is deliberately one coherent system, not a pile of disconnected “AI agents.”

## What LensOS stores

| Record | Purpose |
| --- | --- |
| `studios` | Account, plan, preferences, and brand voice |
| `workflow_audits` | The six onboarding answers and generated blueprint |
| `projects` | A shoot, its client, timeline, and status |
| `assets` | File metadata and locations—never public by default |
| `selections` | Client favorites and photographer-approved images |
| `jobs` | Every requested action, its status, inputs, outputs, and errors |
| `agent_runs` | The plan, tools used, cost, review status, and audit trail |

Every row is attached to a studio. Database permissions should make one studio incapable of reading another studio's projects or photos.

## The LensOS agent team

Do not expose these as confusing “sub-agents” to photographers. They should simply see one calm progress timeline.

1. **Workflow Planner** — reads the photographer's plain-English request and creates a structured plan.
2. **Inbox & Organize** — creates the project, names folders, checks uploads, and finds duplicates or corrupt files.
3. **Photo Review** — identifies technically unusable images and suggests a review set. The photographer always controls deletion.
4. **Client Gallery** — prepares a proofing gallery, client instructions, favorites, and delivery status.
5. **Edit Assistant** — translates approved creative direction into edit instructions; no irreversible batch action without review.
6. **Delivery Concierge** — exports, packages, sends the gallery, and flags a failed delivery for a human.

## One event, one visible timeline

```text
Photographer: “Create a proof gallery for Maya’s 30-minute Central Park shoot”
        ↓
LensOS plans the work
        ↓
Inngest job: upload.checked → photos.reviewed → gallery.prepared → client.notified
        ↓
Supabase saves every state change and streams progress back to the LensOS app
```

## Beta guardrails

- No action that deletes images, emails a client, or publishes a gallery happens without a clear confirmation.
- Keep the first beta focused on workflow records, gallery coordination, and edit plans—not unattended image editing.
- Log every agent run, tool call, and user approval so LensOS can explain what happened and recover from errors.
- Use role-based access and row-level security from day one; photography work is personal client data.

## First build sequence

1. Enable Google, Apple, magic-link email sign-in in Supabase.
2. Save the LensOS audit and show the blueprint in the user’s new account.
3. Add project creation, uploads, and a human-readable activity timeline.
4. Introduce the Workflow Planner with constrained tools and a required approval step.
5. Add background workflows and retries with Inngest.
6. Connect only one gallery provider for the beta; add other integrations after the core workflow is reliable.

## Why this stack

Supabase supports social and email authentication and is designed to pair Auth with database row-level security. Inngest is designed for durable, retriable event-driven functions, which is what long-running uploads and multi-step studio workflows need. The OpenAI Responses API supports stateful, tool-using workflows; use it to produce structured plans, while application code—not the model—remains responsible for permissions and external actions.

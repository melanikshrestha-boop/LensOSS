# LensOS beta setup

The current HTML is a front-end prototype. To make sign-in, survey storage, user counts, and consent real, connect these two services:

- **Supabase** — accounts, Google/Apple/email sign-in, Postgres, and private survey records.
- **PostHog** — consent-gated product analytics: unique users, survey starts/completions, RAW-folder starts, and workspace opens.

## 1. Create the Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** and run [supabase-schema.sql](supabase-schema.sql).
3. Open **Authentication → Providers** and enable Email, Google, and Apple.
4. Add these redirect URLs under **Authentication → URL Configuration**:

   ```text
   http://localhost:8000/outputs/lens-os/index.html
   https://YOUR-DOMAIN.com/outputs/lens-os/index.html
   ```

5. Open **Project Settings → API** and copy the project URL and publishable/anon key into [auth-config.js](auth-config.js):

   ```js
   window.LENSOS_AUTH_CONFIG = {
     supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
     supabaseAnonKey: 'YOUR_PUBLIC_ANON_KEY'
   };
   ```

   Never put a service-role key in a browser file.

Supabase’s browser OAuth flow uses `signInWithOAuth`/the Auth authorize endpoint and redirects back to an allowed URL. The LensOS modal already has the Google, Apple, and passwordless-email buttons; they remain in preview mode until these public values are filled in. See the [official Google login guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 2. Configure Google sign-in

1. In Google Cloud Console, create an OAuth web client.
2. Add your Supabase callback URL as an authorized redirect URI. Supabase shows the exact callback URL in the Google provider panel.
3. Paste the Google client ID and secret into Supabase’s Google provider settings.
4. Add LensOS’s localhost and production URLs to the Google OAuth consent-screen allowlist.

Apple sign-in needs an Apple Services ID, private key, and return URL. Leave the Apple button disabled until those are configured.

## 3. Save and inspect surveys

The page now saves the eight answers locally until a photographer signs in. After Supabase returns an access token, it syncs the pending record to `public.workflow_audits` with row-level security.

In Supabase, use **Table Editor → workflow_audits** to read answers, or run:

```sql
select created_at, survey_answers->>'photographer_type' as photographer_type,
       survey_answers->>'raw_volume' as raw_volume,
       survey_answers->>'delivery_tool' as delivery_tool
from public.workflow_audits
order by created_at desc;
```

For your first user count, use **Authentication → Users**. For signed-in studios, count `profiles` rather than counting survey rows.

## 4. Add consent-gated analytics

1. Create a PostHog project at [us.posthog.com](https://us.posthog.com/).
2. Put the project token and host in [analytics-config.js](analytics-config.js):

   ```js
   window.LENSOS_ANALYTICS_CONFIG = {
     posthogKey: 'YOUR_POSTHOG_PROJECT_TOKEN',
     posthogHost: 'https://us.i.posthog.com'
   };
   ```

   LensOS loads PostHog with opt-out enabled. The cookie banner calls `posthog.opt_in_capturing()` only after **Allow analytics**; **Essential only** calls `posthog.opt_out_capturing()`.

3. Keep analytics off for **Essential only**. The page will not send survey, RAW, or client data to PostHog without explicit opt-in.

The page already queues these small, non-photo events only after analytics consent:

```text
page_view
survey_started
survey_completed
workspace_opened
raw_ingest_started
privacy_consent_updated
```

Do not send RAW filenames, image previews, client names, email bodies, or client messages to analytics. Keep those in Supabase Storage/database with per-user row-level security.

PostHog’s browser library supports explicit opt-in/opt-out and stable user identification; use the Supabase user ID after login, not the photographer’s email, as the analytics identifier. See the [PostHog JavaScript docs](https://posthog.com/docs/libraries/js).

## 5. Run the page locally

From the `hi` folder:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/outputs/lens-os/index.html
```

OAuth cannot complete from `file://`. Test sign-in from localhost or the eventual HTTPS domain.

## Privacy baseline

- Essential storage only until the visitor chooses analytics.
- Survey answers stay local until sign-in, then sync to the signed-in photographer’s private row.
- No client originals or messages go to PostHog.
- Add a real privacy policy and retention/deletion controls before inviting beta users.

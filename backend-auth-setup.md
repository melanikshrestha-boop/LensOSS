# LensOS authentication handoff

The current LensOS signup modal supports two modes:

- Preview mode: saves the entered email only in this browser so the interface can be tested safely.
- Connected mode: sends email magic links and starts Google or Apple OAuth through Supabase Auth.

## Connect Supabase

Create a Supabase project and enable these authentication providers:

1. Email with magic links.
2. Google OAuth.
3. Apple OAuth.

Add the LensOS production URL and local preview URL to the allowed redirect URLs in Supabase. Configure the same URLs in the Google Cloud OAuth client.

For a real local test, serve LensOS from `http://localhost`; OAuth cannot complete from a `file://` URL. Add that localhost callback URL to Supabase and both provider configurations. Apple OAuth also requires an Apple Services ID and Sign in with Apple key configured in Supabase.

Before the main LensOS script runs, add the public project values to [auth-config.js](auth-config.js):

```html
<script>
  window.LENSOS_AUTH_CONFIG = {
    supabaseUrl: "https://YOUR_PROJECT.supabase.co",
    supabaseAnonKey: "YOUR_PUBLIC_ANON_KEY"
  };
</script>
```

Use only the public anonymous key in the browser. Never place the Supabase service-role key in this file.

## Minimum account data

Create a `profiles` table keyed to `auth.users.id` with:

- `id` UUID primary key
- `email` text
- `display_name` text
- `studio_name` text
- `photographer_type` text
- `created_at` timestamp

Then keep events, ingests, delivery packages, clients, and ledger entries attached to that user ID. Enforce row-level security so a signed-in photographer can only read and write records they own.

## What the interface already handles

- Google sign-in button
- Apple sign-in button
- Gmail recognition in the email field
- Password-free email signup
- Loading, success, and failure states
- Preview-mode account persistence
- Supabase OAuth and magic-link endpoints once the public configuration is supplied
- OAuth callback handling that returns the photographer to their new workspace

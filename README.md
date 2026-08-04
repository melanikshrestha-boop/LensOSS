# LensOS

LensOS is a camera-to-client workspace for photographers and media teams.

This repository contains the current product prototype, workflow research, backend notes, and database schema.

## Preview locally

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000).

## Configuration

Authentication and analytics are disabled until their public configuration values are added to:

- `auth-config.js`
- `analytics-config.js`

Never commit private service keys. The browser should receive public client configuration only.

## Current status

This is an ambitious interactive product prototype. The local photo and video experiences demonstrate the intended workflow, but production culling, editing, storage, authentication, analytics, and Adobe handoff still require their respective native and backend services.


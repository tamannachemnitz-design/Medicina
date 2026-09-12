# Medicina

A medication reminder built from the product's own competitive analysis
(`Medicine Tracker App — Competitive Analysis & MVP Spec`). The market scan
found the reminder-app category crowded and feature-parity-saturated, and
recommended a narrow wedge instead of competing head-on: **scan-to-add entry,
SMS/WhatsApp-fallback reminders, and no-install caregiver alerts, wrapped in a
GDPR-conscious privacy story**, targeting Germany/EU first.

This started as a client-only MVP (everything in `localStorage`, no backend).
It now has a real backend: accounts with cross-device sync, on-device OCR for
scan-to-add, and real SMS/WhatsApp delivery via Twilio (optional — see below).

## Architecture

- **`/` (root)** — React + TypeScript + Vite frontend.
- **`/server`** — Express + TypeScript + Prisma (SQLite) API: auth, medications,
  dose events, caregivers, alert log, and a background scheduler.

The frontend is now a thin client over the API — it holds no medical data of
its own; everything is fetched from and written to the backend.

## Running it locally

First time setup:

```bash
npm install
npm --prefix server install

cp .env.example .env                   # frontend: VITE_API_URL
cp server/.env.example server/.env     # backend: DATABASE_URL, JWT_SECRET, etc.

npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate  # creates server/prisma/dev.db
```

Then, every time:

```bash
npm run dev:all      # runs both the frontend (5173) and API (4000)
```

Or run them in separate terminals with `npm run dev` and `npm run dev:server`.

Open `http://localhost:5173`, sign up with an email + password, and go
through the consent screen.

## What's implemented (spec §5.1–5.2)

**Core / table stakes**
- Accounts (email + password, JWT) with medications and dose history synced
  across devices
- Add / edit / pause / delete medications (name, dose, frequency, one or
  more daily times)
- Scheduled reminders via the browser Notification API, with an in-app
  "Today" list for Taken / Skipped / Snooze actions
- Adherence history (daily log, last 90 days) and a streak counter

**The wedge (differentiators)**
- **Scan-to-add with real on-device OCR**: camera capture (`getUserMedia`)
  feeds into [tesseract.js](https://github.com/naptha/tesseract.js), which
  runs entirely in the browser — the photo never leaves the device. Label
  text recognition is inherently noisy on small/curved/glossy labels, so it
  only pre-fills a best guess (`src/lib/ocr.ts`); the form always opens for
  the user to confirm. First use downloads a small WASM + language-model
  bundle from a public CDN (jsdelivr), which is then cached by the browser.
- **SMS/WhatsApp fallback**: if a reminder isn't acknowledged within 15
  minutes, the server (`server/src/scheduling.ts`) sends a fallback text to
  the phone number set in Settings, via Twilio if configured.
- **Caregiver alerts, no install required**: caregivers are a name + phone
  number; alerting them requires both the account-level consent toggle and a
  per-caregiver "patient consented" checkbox (spec §6.3). Delivered the same
  way as the SMS fallback.
- **GDPR-conscious onboarding**: each data use is presented as a separate,
  itemized consent at signup (no bundled "accept all", per spec §6.2).
  Settings → Privacy lets a user revoke any consent or permanently delete
  their account and all data (right to erasure).
- **Doctor-ready export**: one-tap CSV download and a printable/PDF-via-print
  adherence report from the Care tab.

## Real SMS/WhatsApp delivery (optional)

Without any configuration, escalations are recorded in the Alert Log as
`logged` — nothing is actually sent, so the feature is fully demoable with no
account required. To send real messages, add to `server/.env`:

```
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_SMS_FROM="+15005550006"
# TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"   # needs Twilio's WhatsApp sandbox/approval
```

Restart the server; alert log entries will show `sent` or `failed` instead of
`logged`. See `server/src/sms.ts` for the integration point if you'd rather
use a different provider (Vonage, MessageBird, etc.) — swap out that one file.

## Deferred / stubbed on purpose (spec §5.3, §6.4, §6.5)

- **Drug interaction checking** — deliberately out of scope. Real interaction
  data (First Databank, RxNorm) requires paid licensing, and shipping
  home-grown interaction logic in a medication app is a liability risk the
  analysis flags directly (§6.4). This also keeps the app clear of medical
  device classification triggers (§6.1) — Medicina only reminds and logs.
- **Mood/symptom diary** — out of scope per the analysis (already well served
  by MyTherapy); revisit only if pivoting toward broader chronic-condition
  tracking.

## Architecture notes

- `server/prisma/schema.prisma` — User, Medication, DoseEvent, Caregiver,
  AlertLog. SQLite for zero-config local dev; swap the `datasource` provider
  to `postgresql` and update `DATABASE_URL` to move to a hosted Postgres
  instance (Render, Railway, Fly.io, Supabase, etc.) for production.
- `server/src/scheduling.ts` — runs every 30s (`server/src/scheduler.ts`):
  creates today's dose events for active medications, sweeps hour-overdue
  pending doses to `missed`, and escalates doses pending 15+ minutes
  (SMS/WhatsApp fallback + consenting caregivers). This runs server-side so
  escalation fires even if no device has the app open — the "notification
  reliability" gap the competitive analysis flagged (§3, §6.5).
- Push-style reminders themselves (the browser `Notification` popup) are
  still client-side, since that's a browser API tied to an open tab —
  `src/context/AppContext.tsx` polls for due doses every 30s and fires them.
- `src/lib/adherence.ts` — streak and adherence-rate calculations (client-side,
  over data fetched from `/api/dose-events/history`).
- `src/lib/export.ts` — CSV and printable doctor-report generation.
- Auth uses a JWT in `localStorage`, not an httpOnly cookie — a reasonable
  MVP trade-off, but a production hardening pass should move to
  httpOnly cookies + refresh tokens, and add rate limiting to the auth routes.
- Reminder times are stored and scheduled using the server process's local
  time zone (no per-user time zone yet) — fine for a single-region deployment,
  worth fixing before a genuinely global launch.

## Legal disclaimer

Medicina is a reminder and logging tool only. It does not diagnose, treat,
or provide dosage guidance, and does not check drug interactions — this is
reflected in-app (Today and Settings screens) and is a deliberate scope
boundary, not an oversight (spec §6.1, §6.6). This is not legal or
regulatory advice; consult a healthcare compliance attorney before launch in
any target market.

# Medicina

A privacy-first medication reminder MVP, built from the product's own competitive
analysis (`Medicine Tracker App — Competitive Analysis & MVP Spec`). The market
scan found the reminder-app category crowded and feature-parity-saturated, and
recommended a narrow wedge instead of competing head-on: **scan-to-add entry,
SMS/WhatsApp-fallback reminders, and no-install caregiver alerts, wrapped in a
GDPR-native, local-only privacy story**, targeting Germany/EU first.

This app is a client-only React + TypeScript + Vite build of that MVP feature
plan. There is no backend — every choice below follows directly from the
"privacy-as-a-feature" positioning the analysis identified as underleveraged.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build
npm run lint      # oxlint
```

## What's implemented (spec §5.1–5.2)

**Core / table stakes**
- Add / edit / pause / delete medications (name, dose, frequency, one or more
  daily times)
- Scheduled reminders via the browser Notification API, with an in-app
  "Today" list for Taken / Skipped / Snooze actions (works even where
  notification permission is denied)
- Adherence history (daily log) and a streak counter

**The wedge (differentiators)**
- **Scan-to-add**: camera capture (`getUserMedia`) opens straight into the
  medication form. Automatic label OCR is a real ML/vendor integration and is
  explicitly out of scope for this MVP — see `src/components/ScanToAdd.tsx`
  for the intended integration point.
- **SMS/WhatsApp fallback**: if a reminder isn't acknowledged within 15
  minutes, the app logs the fallback message it *would* send. No carrier is
  wired up (see "Deferred / stubbed" below).
- **Caregiver alerts, no install required**: caregivers are just a name +
  phone number; alerting them requires both the app-level consent toggle and
  a per-caregiver "patient consented" checkbox (spec §6.3).
- **Privacy-first, GDPR-native storage**: onboarding presents each data use
  as a separate, itemized consent (no bundled "accept all", per spec §6.2);
  all data lives in `localStorage` only; Settings → Privacy lets a user
  revoke any consent or permanently erase all data (right to erasure).
- **Doctor-ready export**: one-tap CSV download and a printable/PDF-via-print
  adherence report from the Care tab.

## Deferred / stubbed on purpose (spec §5.3, §6.4, §6.5)

- **Real OCR / label parsing** — needs an on-device model or a paid vision
  API; the camera flow is built, parsing is not.
- **Real SMS/WhatsApp delivery** — needs a licensed gateway (e.g. Twilio) and
  its own reliability testing before launch; currently logged to an in-app
  Alert Log (`src/lib/alerts.ts`) instead of sent.
- **Drug interaction checking** — deliberately out of scope. Real interaction
  data (First Databank, RxNorm) requires paid licensing, and shipping
  home-grown interaction logic in a medication app is a liability risk the
  analysis flags directly (§6.4). This also keeps the app clear of medical
  device classification triggers (§6.1) — Medicina only reminds and logs.
- **Mood/symptom diary** — out of scope per the analysis (already well served
  by MyTherapy); revisit only if pivoting toward broader chronic-condition
  tracking.

## Architecture notes

- `src/context/AppContext.tsx` — single reducer holding all state
  (medications, dose events, caregivers, consents, alert log), persisted to
  `localStorage` on every change (`src/lib/storage.ts`).
- `src/lib/scheduling.ts` — generates today's dose events from active
  medications, sweeps overdue pending doses to `missed`.
- A 30-second poll (`TICK`) fires notifications for due doses and, once past
  the 15-minute escalation window, appends fallback/caregiver entries to the
  alert log — gated by the relevant consent toggles.
- `src/lib/adherence.ts` — streak and adherence-rate calculations.
- `src/lib/export.ts` — CSV and printable doctor-report generation.

## Legal disclaimer

Medicina is a reminder and logging tool only. It does not diagnose, treat,
or provide dosage guidance, and does not check drug interactions — this is
reflected in-app (Today and Settings screens) and is a deliberate scope
boundary, not an oversight (spec §6.1, §6.6). This is not legal or
regulatory advice; consult a healthcare compliance attorney before launch in
any target market.

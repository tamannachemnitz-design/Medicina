import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { ConsentState } from '../types'
import { DEFAULT_CONSENTS } from '../types'

const ITEMS: { key: keyof Omit<ConsentState, 'consentedAt'>; title: string; body: string; required?: boolean }[] = [
  {
    key: 'essentialStorage',
    title: 'Store my medications on this device',
    body: 'Required to use Medicina. Your medication list and dose history are saved only in this browser’s local storage — never uploaded to a server.',
    required: true,
  },
  {
    key: 'reminders',
    title: 'Send me reminder notifications',
    body: 'Medicina asks your browser for permission to show a notification at each scheduled dose time.',
  },
  {
    key: 'smsWhatsappFallback',
    title: 'Escalate to SMS/WhatsApp if I miss a reminder',
    body: 'If a push reminder isn’t acknowledged within 15 minutes, Medicina logs a fallback message it would send (MVP demo — no real carrier is connected yet).',
  },
  {
    key: 'caregiverAlerts',
    title: 'Alert a caregiver about missed doses',
    body: 'Shares dose-status information — which is linked to your health — with someone you name below. You can revoke this at any time in Settings, and each caregiver also needs their own entry marked consented.',
  },
]

export default function Onboarding() {
  const { setConsents } = useApp()
  const [consents, setLocal] = useState<ConsentState>(DEFAULT_CONSENTS)

  const toggle = (key: keyof ConsentState) => {
    if (key === 'essentialStorage') return
    setLocal((c) => ({ ...c, [key]: !c[key as keyof ConsentState] }))
  }

  return (
    <div className="screen onboarding">
      <div className="onboarding-card">
        <h1>Welcome to Medicina</h1>
        <p className="muted">
          A private, on-device medication reminder. This isn’t medical advice — Medicina only helps you
          remember doses you’ve told it about.
        </p>

        <h2>Before you start</h2>
        <p className="muted small">
          Medication data counts as special-category health data under GDPR. Please review each permission below
          individually — nothing here is bundled into one blanket "accept all".
        </p>

        <ul className="consent-list">
          {ITEMS.map((item) => (
            <li key={item.key}>
              <label className="consent-item">
                <input
                  type="checkbox"
                  checked={item.required ? true : Boolean(consents[item.key])}
                  disabled={item.required}
                  onChange={() => toggle(item.key)}
                />
                <div>
                  <div className="consent-title">
                    {item.title}
                    {item.required && <span className="badge">required</span>}
                  </div>
                  <div className="muted small">{item.body}</div>
                </div>
              </label>
            </li>
          ))}
        </ul>

        <button
          className="primary"
          onClick={() => setConsents({ ...consents, essentialStorage: true })}
        >
          Continue
        </button>
        <p className="muted small legal">
          You can change any of these choices later in Settings → Privacy, including permanently deleting all
          stored data.
        </p>
      </div>
    </div>
  )
}

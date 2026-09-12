import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { ConsentState } from '../types'
import { DEFAULT_CONSENTS } from '../types'

const ITEMS: { key: keyof Omit<ConsentState, 'consentedAt'>; title: string; body: string; required?: boolean }[] = [
  {
    key: 'essentialStorage',
    title: 'Store my medications in my Medicina account',
    body: 'Required to use Medicina. Your medication list and dose history are stored in your account so they’re available across your devices — nothing is sold or shared with third parties.',
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
    body: 'If a reminder isn’t acknowledged within 15 minutes, the server sends a fallback text to your phone number (set one in Settings). Real delivery requires an SMS provider to be configured on the backend — until then, attempts are only logged.',
  },
  {
    key: 'caregiverAlerts',
    title: 'Alert a caregiver about missed doses',
    body: 'Shares dose-status information — which is linked to your health — with someone you name below. You can revoke this at any time in Settings, and each caregiver also needs their own entry marked consented.',
  },
]

export default function Onboarding() {
  const { updateConsents } = useAuth()
  const [consents, setLocal] = useState<ConsentState>(DEFAULT_CONSENTS)
  const [submitting, setSubmitting] = useState(false)

  const toggle = (key: keyof ConsentState) => {
    if (key === 'essentialStorage') return
    setLocal((c) => ({ ...c, [key]: !c[key as keyof ConsentState] }))
  }

  const continue_ = async () => {
    setSubmitting(true)
    try {
      await updateConsents({ ...consents, essentialStorage: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="screen onboarding">
      <div className="onboarding-card">
        <h1>Welcome to Medicina</h1>
        <p className="muted">
          A private, GDPR-conscious medication reminder. This isn’t medical advice — Medicina only helps you
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

        <button className="primary" onClick={continue_} disabled={submitting}>
          {submitting ? 'Saving…' : 'Continue'}
        </button>
        <p className="muted small legal">
          You can change any of these choices later in Settings → Privacy, including permanently deleting your
          account and all stored data.
        </p>
      </div>
    </div>
  )
}

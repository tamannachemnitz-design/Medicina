import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const { user, updateConsents, updatePhone, deleteAccount, logout } = useAuth()
  const [confirmingErase, setConfirmingErase] = useState(false)
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [savingPhone, setSavingPhone] = useState(false)

  if (!user) return null
  const consents = user.consents

  const toggle = (key: 'reminders' | 'caregiverAlerts' | 'smsWhatsappFallback') => {
    updateConsents({ ...consents, [key]: !consents[key] })
  }

  const savePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPhone(true)
    try {
      await updatePhone(phone.trim())
    } finally {
      setSavingPhone(false)
    }
  }

  return (
    <div className="screen">
      <h2>Account</h2>
      <p className="muted small">Signed in as {user.email}</p>
      <button className="ghost" onClick={logout}>
        Log out
      </button>

      <h2 className="section-gap">Privacy & data</h2>

      <ul className="consent-list">
        <li>
          <label className="consent-item">
            <input type="checkbox" checked readOnly disabled />
            <div>
              <div className="consent-title">
                Account storage <span className="badge">required</span>
              </div>
              <div className="muted small">
                Your medication and dose data is stored in your Medicina account so it's available across your
                devices.
              </div>
            </div>
          </label>
        </li>
        <li>
          <label className="consent-item">
            <input type="checkbox" checked={consents.reminders} onChange={() => toggle('reminders')} />
            <div>
              <div className="consent-title">Reminder notifications</div>
            </div>
          </label>
        </li>
        <li>
          <label className="consent-item">
            <input
              type="checkbox"
              checked={consents.smsWhatsappFallback}
              onChange={() => toggle('smsWhatsappFallback')}
            />
            <div>
              <div className="consent-title">SMS/WhatsApp fallback</div>
            </div>
          </label>
        </li>
        <li>
          <label className="consent-item">
            <input type="checkbox" checked={consents.caregiverAlerts} onChange={() => toggle('caregiverAlerts')} />
            <div>
              <div className="consent-title">Caregiver alerts</div>
            </div>
          </label>
        </li>
      </ul>

      <form onSubmit={savePhone} className="form inline-form">
        <label style={{ flex: 1 }}>
          Your phone number (for SMS/WhatsApp fallback)
          <input
            type="tel"
            placeholder="+1 555 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <button type="submit" className="ghost" disabled={savingPhone}>
          {savingPhone ? 'Saving…' : 'Save'}
        </button>
      </form>

      <h2 className="section-gap">Your rights</h2>
      <p className="muted small">
        You can permanently erase your account and every medication, dose record, caregiver, and consent stored by
        Medicina at any time — this cannot be undone.
      </p>

      {!confirmingErase ? (
        <button className="ghost danger" onClick={() => setConfirmingErase(true)}>
          Delete my account and all data
        </button>
      ) : (
        <div className="confirm-erase">
          <p>This permanently deletes your account and everything in it. Are you sure?</p>
          <div className="modal-actions">
            <button className="ghost" onClick={() => setConfirmingErase(false)}>
              Cancel
            </button>
            <button className="danger primary" onClick={deleteAccount}>
              Yes, delete everything
            </button>
          </div>
        </div>
      )}

      <p className="muted small disclaimer section-gap">
        Medicina is a reminder and logging tool only. It does not diagnose, treat, or provide dosage guidance, and
        does not check drug interactions. Always follow your prescriber's and pharmacist's instructions, and
        consult a healthcare professional with any medical questions.
      </p>
    </div>
  )
}

import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { state, setConsents, eraseAll } = useApp()
  const [confirmingErase, setConfirmingErase] = useState(false)

  const toggle = (key: 'reminders' | 'caregiverAlerts' | 'smsWhatsappFallback') => {
    setConsents({ ...state.consents, [key]: !state.consents[key] })
  }

  return (
    <div className="screen">
      <h2>Privacy & data</h2>

      <ul className="consent-list">
        <li>
          <label className="consent-item">
            <input type="checkbox" checked readOnly disabled />
            <div>
              <div className="consent-title">
                Local storage <span className="badge">required</span>
              </div>
              <div className="muted small">
                All medication and dose data stays in this browser's local storage. Nothing is uploaded to a
                server.
              </div>
            </div>
          </label>
        </li>
        <li>
          <label className="consent-item">
            <input type="checkbox" checked={state.consents.reminders} onChange={() => toggle('reminders')} />
            <div>
              <div className="consent-title">Reminder notifications</div>
            </div>
          </label>
        </li>
        <li>
          <label className="consent-item">
            <input
              type="checkbox"
              checked={state.consents.smsWhatsappFallback}
              onChange={() => toggle('smsWhatsappFallback')}
            />
            <div>
              <div className="consent-title">SMS/WhatsApp fallback (simulated)</div>
            </div>
          </label>
        </li>
        <li>
          <label className="consent-item">
            <input
              type="checkbox"
              checked={state.consents.caregiverAlerts}
              onChange={() => toggle('caregiverAlerts')}
            />
            <div>
              <div className="consent-title">Caregiver alerts</div>
            </div>
          </label>
        </li>
      </ul>

      <h2 className="section-gap">Your rights</h2>
      <p className="muted small">
        You can permanently erase every medication, dose record, caregiver, and consent stored by Medicina on this
        device at any time — this cannot be undone.
      </p>

      {!confirmingErase ? (
        <button className="ghost danger" onClick={() => setConfirmingErase(true)}>
          Delete all my data
        </button>
      ) : (
        <div className="confirm-erase">
          <p>This permanently deletes everything. Are you sure?</p>
          <div className="modal-actions">
            <button className="ghost" onClick={() => setConfirmingErase(false)}>
              Cancel
            </button>
            <button className="danger primary" onClick={eraseAll}>
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

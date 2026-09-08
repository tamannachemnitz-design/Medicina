import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { downloadCsv, openDoctorReport } from '../lib/export'

export default function Care() {
  const { state, addCaregiver, updateCaregiver, deleteCaregiver } = useApp()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    addCaregiver({ name: name.trim(), phone: phone.trim(), consentGiven: false })
    setName('')
    setPhone('')
  }

  return (
    <div className="screen">
      <h2>Caregivers</h2>
      {!state.consents.caregiverAlerts && (
        <p className="hint">
          Caregiver alerts are off. Turn them on in Settings → Privacy before adding contacts here.
        </p>
      )}

      <ul className="med-list">
        {state.caregivers.map((c) => (
          <li key={c.id} className="med-card">
            <div>
              <div className="med-name">{c.name}</div>
              <div className="muted small">{c.phone}</div>
            </div>
            <div className="med-actions">
              <label className="consent-inline">
                <input
                  type="checkbox"
                  checked={c.consentGiven}
                  onChange={(e) => updateCaregiver(c.id, { consentGiven: e.target.checked })}
                />
                Patient consented to alert this person
              </label>
              <button className="ghost small danger" onClick={() => deleteCaregiver(c.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="form inline-form">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button type="submit" className="primary">
          Add caregiver
        </button>
      </form>

      <h2 className="section-gap">Doctor-ready export</h2>
      <p className="muted small">Share a summary of logged doses with a clinician.</p>
      <div className="modal-actions">
        <button className="ghost" onClick={() => downloadCsv(state)}>
          Download CSV
        </button>
        <button className="ghost" onClick={() => openDoctorReport(state)}>
          Print / save PDF
        </button>
      </div>

      <h2 className="section-gap">Alert log</h2>
      <p className="muted small">
        SMS/WhatsApp fallback and caregiver alerts are simulated in this MVP (no carrier connected yet) — this log
        shows exactly what would have been sent.
      </p>
      {state.alertLog.length === 0 && <p className="muted">No alerts sent yet.</p>}
      <ul className="alert-log">
        {[...state.alertLog].reverse().map((a) => (
          <li key={a.id}>
            <span className="badge">{a.channel}</span> to <strong>{a.target}</strong>: {a.message}
            <div className="muted small">{new Date(a.sentAt).toLocaleString()}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Medication } from '../types'
import MedicationForm from './MedicationForm'

export default function MedicationList() {
  const { state, deleteMedication, updateMedication } = useApp()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Medication | null>(null)

  if (adding || editing) {
    return (
      <MedicationForm
        editing={editing ?? undefined}
        onDone={() => {
          setAdding(false)
          setEditing(null)
        }}
      />
    )
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Medications</h2>
        <button className="primary" onClick={() => setAdding(true)}>
          + Add
        </button>
      </div>

      {state.medications.length === 0 && (
        <p className="muted">No medications yet. Add one, or scan a label to get started.</p>
      )}

      <ul className="med-list">
        {state.medications.map((m) => (
          <li key={m.id} className={`med-card ${m.active ? '' : 'inactive'}`}>
            <div>
              <div className="med-name">{m.name}</div>
              <div className="muted small">
                {m.dose} · {m.times.join(', ')}
              </div>
              {m.notes && <div className="muted small">{m.notes}</div>}
            </div>
            <div className="med-actions">
              <button className="ghost small" onClick={() => setEditing(m)}>
                Edit
              </button>
              <button className="ghost small" onClick={() => updateMedication(m.id, { active: !m.active })}>
                {m.active ? 'Pause' : 'Resume'}
              </button>
              <button className="ghost small danger" onClick={() => deleteMedication(m.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

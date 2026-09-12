import { useState } from 'react'
import { useApp } from '../context/AppContext'
import type { Frequency, Medication } from '../types'
import ScanToAdd from './ScanToAdd'

const FREQUENCY_DEFAULT_TIMES: Record<Frequency, string[]> = {
  'once-daily': ['09:00'],
  'twice-daily': ['09:00', '21:00'],
  'three-times-daily': ['08:00', '14:00', '20:00'],
  custom: ['09:00'],
}

interface Props {
  editing?: Medication
  onDone: () => void
}

export default function MedicationForm({ editing, onDone }: Props) {
  const { addMedication, updateMedication } = useApp()
  const [name, setName] = useState(editing?.name ?? '')
  const [dose, setDose] = useState(editing?.dose ?? '')
  const [frequency, setFrequency] = useState<Frequency>(editing?.frequency ?? 'once-daily')
  const [times, setTimes] = useState<string[]>(editing?.times ?? FREQUENCY_DEFAULT_TIMES['once-daily'])
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [showScan, setShowScan] = useState(false)
  const [scanPhoto, setScanPhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeFrequency = (f: Frequency) => {
    setFrequency(f)
    if (f !== 'custom') setTimes(FREQUENCY_DEFAULT_TIMES[f])
  }

  const updateTime = (i: number, value: string) => {
    setTimes((t) => t.map((x, idx) => (idx === i ? value : x)))
  }

  const addTime = () => setTimes((t) => [...t, '12:00'])
  const removeTime = (i: number) => setTimes((t) => t.filter((_, idx) => idx !== i))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !dose.trim() || times.length === 0) return
    const payload = { name: name.trim(), dose: dose.trim(), frequency, times, notes: notes.trim(), active: true }
    setSaving(true)
    setError(null)
    try {
      if (editing) await updateMedication(editing.id, payload)
      else await addMedication(payload)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this medication')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <h2>{editing ? 'Edit medication' : 'Add medication'}</h2>

      {!editing && (
        <button type="button" className="ghost scan-cta" onClick={() => setShowScan(true)}>
          📷 Scan label instead
        </button>
      )}
      {scanPhoto && (
        <div className="scan-thumb-row">
          <img src={scanPhoto} alt="Captured medication label" className="scan-thumb" />
          <span className="muted small">
            Photo captured — check the details below, since label reading isn't perfect.
          </span>
        </div>
      )}

      <form onSubmit={submit} className="form">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Metformin" required />
        </label>
        <label>
          Dose
          <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 500mg" required />
        </label>
        <label>
          Frequency
          <select value={frequency} onChange={(e) => changeFrequency(e.target.value as Frequency)}>
            <option value="once-daily">Once daily</option>
            <option value="twice-daily">Twice daily</option>
            <option value="three-times-daily">Three times daily</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        <div className="times-block">
          <span>Reminder times</span>
          {times.map((t, i) => (
            <div key={i} className="time-row">
              <input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)} required />
              {times.length > 1 && (
                <button type="button" className="ghost small" onClick={() => removeTime(i)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" className="ghost small" onClick={addTime}>
            + Add another time
          </button>
        </div>

        <label>
          Notes (optional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onDone}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add medication'}
          </button>
        </div>
      </form>

      {showScan && (
        <ScanToAdd
          onClose={() => setShowScan(false)}
          onCaptured={(photo, parsed) => {
            setScanPhoto(photo)
            if (parsed.name && !name) setName(parsed.name)
            if (parsed.dose && !dose) setDose(parsed.dose)
            setShowScan(false)
          }}
        />
      )}
    </div>
  )
}

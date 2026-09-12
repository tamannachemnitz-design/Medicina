import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { currentStreak } from '../lib/adherence'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Upcoming',
  taken: 'Taken',
  skipped: 'Skipped',
  missed: 'Missed',
  snoozed: 'Snoozed',
}

export default function Today() {
  const { state, recordDose } = useApp()
  const { user } = useAuth()
  const streak = currentStreak(state.history)

  const todaysDoses = [...state.doseEvents].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))

  return (
    <div className="screen">
      <div className="screen-header">
        <h2>Today</h2>
        {streak > 0 && <span className="streak-badge">🔥 {streak}-day streak</span>}
      </div>

      {!user?.consents.reminders && (
        <p className="hint">
          Reminder notifications are off. Turn them on in Settings → Privacy to get alerted at dose time.
        </p>
      )}

      {todaysDoses.length === 0 && <p className="muted">Nothing scheduled today. Add a medication to get started.</p>}

      <ul className="dose-list">
        {todaysDoses.map((e) => {
          const med = state.medications.find((m) => m.id === e.medicationId)
          if (!med) return null
          const time = new Date(e.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return (
            <li key={e.id} className={`dose-card status-${e.status}`}>
              <div>
                <div className="med-name">
                  {time} · {med.name}
                </div>
                <div className="muted small">
                  {med.dose} · {STATUS_LABEL[e.status]}
                </div>
              </div>
              {(e.status === 'pending' || e.status === 'missed') && (
                <div className="dose-actions">
                  <button className="primary small" onClick={() => recordDose(e.id, 'taken')}>
                    Taken
                  </button>
                  <button className="ghost small" onClick={() => recordDose(e.id, 'skipped')}>
                    Skip
                  </button>
                  <button className="ghost small" onClick={() => recordDose(e.id, 'snoozed')}>
                    Snooze 10m
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <p className="muted small disclaimer">
        Medicina only reminds you about medications you’ve entered — it does not provide medical advice, dosage
        guidance, or interaction checking.
      </p>
    </div>
  )
}

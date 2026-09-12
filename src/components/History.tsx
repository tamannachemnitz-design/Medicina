import { useApp } from '../context/AppContext'
import { adherenceRate, currentStreak, historyByDay } from '../lib/adherence'

const STATUS_ICON: Record<string, string> = {
  taken: '✅',
  skipped: '⏭️',
  missed: '⚠️',
  pending: '⏳',
  snoozed: '💤',
}

export default function History() {
  const { state } = useApp()
  const streak = currentStreak(state.history)
  const rate = adherenceRate(state.history)
  const days = historyByDay(state.history).slice(0, 30)

  return (
    <div className="screen">
      <h2>Adherence history</h2>

      <div className="stat-row">
        <div className="stat-tile">
          <div className="stat-value">{streak}</div>
          <div className="muted small">day streak</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{Math.round(rate * 100)}%</div>
          <div className="muted small">doses taken</div>
        </div>
      </div>

      {days.length === 0 && <p className="muted">No dose history yet.</p>}

      <ul className="history-list">
        {days.map((day) => (
          <li key={day.date} className="history-day">
            <div className="history-date">
              {new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="history-doses">
              {day.events
                .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
                .map((e) => {
                  const med = state.medications.find((m) => m.id === e.medicationId)
                  return (
                    <span key={e.id} className="history-pill" title={`${med?.name ?? 'Unknown'} — ${e.status}`}>
                      {STATUS_ICON[e.status]} {med?.name ?? 'Unknown'}
                    </span>
                  )
                })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

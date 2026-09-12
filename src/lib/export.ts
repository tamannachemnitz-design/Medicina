import type { DoseEvent, Medication } from '../types'
import { historyByDay } from './adherence'

interface ExportData {
  medications: Medication[]
  doseEvents: DoseEvent[]
}

function escapeCsv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function buildAdherenceCsv(data: ExportData): string {
  const rows = [['Date', 'Time', 'Medication', 'Dose', 'Status']]
  for (const day of historyByDay(data.doseEvents)) {
    for (const e of day.events.sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))) {
      const med = data.medications.find((m) => m.id === e.medicationId)
      const dt = new Date(e.scheduledFor)
      rows.push([
        day.date,
        dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        med?.name ?? 'Unknown',
        med?.dose ?? '',
        e.status,
      ])
    }
  }
  return rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
}

export function downloadCsv(data: ExportData): void {
  const csv = buildAdherenceCsv(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `medicina-adherence-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function buildDoctorReportHtml(data: ExportData): string {
  const days = historyByDay(data.doseEvents)
  const rows = days
    .map((day) => {
      const items = day.events
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor))
        .map((e) => {
          const med = data.medications.find((m) => m.id === e.medicationId)
          const time = new Date(e.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return `<li>${time} — ${med?.name ?? 'Unknown'} (${med?.dose ?? ''}): <strong>${e.status}</strong></li>`
        })
        .join('')
      return `<tr><td>${day.date}</td><td><ul>${items}</ul></td></tr>`
    })
    .join('')

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Medicina adherence report</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 2rem; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  td { border-bottom: 1px solid #ddd; padding: 0.5rem; vertical-align: top; }
  ul { margin: 0; padding-left: 1.2rem; }
  .meta { color: #555; font-size: 0.9rem; }
  .disclaimer { margin-top: 2rem; font-size: 0.8rem; color: #777; }
</style></head>
<body>
  <h1>Medicina — Adherence Report</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  <table><tbody>${rows}</tbody></table>
  <p class="disclaimer">
    This report reflects medication reminders self-logged by the patient in the Medicina app. It is not a
    clinical record and has not been verified by a healthcare professional. Not medical advice.
  </p>
</body></html>`
}

export function openDoctorReport(data: ExportData): void {
  const html = buildDoctorReportHtml(data)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}

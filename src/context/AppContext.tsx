import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { AlertLogEntry, AppState, Caregiver, DoseEvent, DoseStatus, Medication } from '../types'
import { INITIAL_STATE } from '../types'
import { api } from '../lib/api'
import { requestNotificationPermission, showReminderNotification } from '../lib/notifications'
import { useAuth } from './AuthContext'

interface Ctx {
  state: AppState
  loading: boolean
  addMedication: (m: { name: string; dose: string; frequency: string; times: string[]; notes?: string }) => Promise<void>
  updateMedication: (id: string, patch: Partial<Medication>) => Promise<void>
  deleteMedication: (id: string) => Promise<void>
  recordDose: (id: string, status: DoseStatus) => Promise<void>
  addCaregiver: (c: { name: string; phone: string }) => Promise<void>
  updateCaregiver: (id: string, patch: Partial<Caregiver>) => Promise<void>
  deleteCaregiver: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<AppState>(INITIAL_STATE)
  const [loading, setLoading] = useState(true)
  const notifiedLocally = useRef(new Set<string>())

  const refresh = async () => {
    const [medications, doseEvents, history, caregivers, alertLog] = await Promise.all([
      api.get<Medication[]>('/api/medications'),
      api.get<DoseEvent[]>('/api/dose-events'),
      api.get<DoseEvent[]>('/api/dose-events/history?days=90'),
      api.get<Caregiver[]>('/api/caregivers'),
      api.get<AlertLogEntry[]>('/api/alert-log'),
    ])
    setState({ medications, doseEvents, history, caregivers, alertLog })
  }

  useEffect(() => {
    if (!user) {
      setState(INITIAL_STATE)
      setLoading(false)
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Poll for server-driven changes (escalations, missed sweeps) and fire local reminders.
  useEffect(() => {
    if (!user) return
    const id = window.setInterval(async () => {
      const [doseEvents, history, alertLog] = await Promise.all([
        api.get<DoseEvent[]>('/api/dose-events'),
        api.get<DoseEvent[]>('/api/dose-events/history?days=90'),
        api.get<AlertLogEntry[]>('/api/alert-log'),
      ])

      if (user.consents.reminders) {
        const now = Date.now()
        for (const e of doseEvents) {
          if (e.status !== 'pending' || e.notifiedAt || notifiedLocally.current.has(e.id)) continue
          if (new Date(e.scheduledFor).getTime() > now) continue
          const med = state.medications.find((m) => m.id === e.medicationId)
          if (!med) continue
          showReminderNotification('Medicina reminder', `${med.name} — ${med.dose}`)
          notifiedLocally.current.add(e.id)
          api.patch(`/api/dose-events/${e.id}`, { notifiedAt: true }).catch(() => undefined)
        }
      }

      setState((s) => ({ ...s, doseEvents, history, alertLog }))
    }, 30_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.consents.reminders, state.medications])

  useEffect(() => {
    if (user?.consents.reminders) requestNotificationPermission()
  }, [user?.consents.reminders])

  const value = useMemo<Ctx>(
    () => ({
      state,
      loading,
      refresh,
      addMedication: async (m) => {
        await api.post<Medication>('/api/medications', m)
        await refresh()
      },
      updateMedication: async (id, patch) => {
        await api.patch<Medication>(`/api/medications/${id}`, patch)
        await refresh()
      },
      deleteMedication: async (id) => {
        await api.delete(`/api/medications/${id}`)
        await refresh()
      },
      recordDose: async (id, status) => {
        await api.patch<DoseEvent>(`/api/dose-events/${id}`, { status })
        await refresh()
      },
      addCaregiver: async (c) => {
        const created = await api.post<Caregiver>('/api/caregivers', c)
        setState((s) => ({ ...s, caregivers: [...s.caregivers, created] }))
      },
      updateCaregiver: async (id, patch) => {
        const updated = await api.patch<Caregiver>(`/api/caregivers/${id}`, patch)
        setState((s) => ({ ...s, caregivers: s.caregivers.map((c) => (c.id === id ? updated : c)) }))
      },
      deleteCaregiver: async (id) => {
        await api.delete(`/api/caregivers/${id}`)
        setState((s) => ({ ...s, caregivers: s.caregivers.filter((c) => c.id !== id) }))
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, loading],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

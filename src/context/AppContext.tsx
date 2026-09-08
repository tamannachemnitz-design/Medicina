import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import type { AppState, Caregiver, ConsentState, DoseStatus, Medication } from '../types'
import { INITIAL_STATE } from '../types'
import { eraseAllData, loadState, newId, saveState } from '../lib/storage'
import { ensureTodayEvents, isDueForEscalation, isDueForNotification, sweepMissedDoses } from '../lib/scheduling'
import { requestNotificationPermission, showReminderNotification } from '../lib/notifications'
import { buildAlert } from '../lib/alerts'

type Action =
  | { type: 'REPLACE_STATE'; state: AppState }
  | { type: 'SET_CONSENTS'; consents: ConsentState }
  | { type: 'ADD_MEDICATION'; medication: Medication }
  | { type: 'UPDATE_MEDICATION'; id: string; patch: Partial<Medication> }
  | { type: 'DELETE_MEDICATION'; id: string }
  | { type: 'RECORD_DOSE'; id: string; status: DoseStatus }
  | { type: 'ADD_CAREGIVER'; caregiver: Caregiver }
  | { type: 'UPDATE_CAREGIVER'; id: string; patch: Partial<Caregiver> }
  | { type: 'DELETE_CAREGIVER'; id: string }
  | { type: 'TICK' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'REPLACE_STATE':
      return action.state
    case 'SET_CONSENTS':
      return {
        ...state,
        onboarded: true,
        consents: { ...action.consents, consentedAt: new Date().toISOString() },
      }
    case 'ADD_MEDICATION': {
      const medications = [...state.medications, action.medication]
      return { ...state, medications, doseEvents: ensureTodayEvents(medications, state.doseEvents) }
    }
    case 'UPDATE_MEDICATION': {
      const medications = state.medications.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m))
      return { ...state, medications, doseEvents: ensureTodayEvents(medications, state.doseEvents) }
    }
    case 'DELETE_MEDICATION':
      return {
        ...state,
        medications: state.medications.filter((m) => m.id !== action.id),
        doseEvents: state.doseEvents.filter((e) => e.medicationId !== action.id),
      }
    case 'RECORD_DOSE': {
      const now = new Date()
      return {
        ...state,
        doseEvents: state.doseEvents.map((e) => {
          if (e.id !== action.id) return e
          if (action.status === 'snoozed') {
            const next = new Date(now.getTime() + 10 * 60 * 1000)
            return { ...e, status: 'pending', scheduledFor: next.toISOString(), notifiedAt: undefined, escalatedAt: undefined }
          }
          return { ...e, status: action.status, actedAt: now.toISOString() }
        }),
      }
    }
    case 'ADD_CAREGIVER':
      return { ...state, caregivers: [...state.caregivers, action.caregiver] }
    case 'UPDATE_CAREGIVER':
      return {
        ...state,
        caregivers: state.caregivers.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)),
      }
    case 'DELETE_CAREGIVER':
      return { ...state, caregivers: state.caregivers.filter((c) => c.id !== action.id) }
    case 'TICK': {
      const now = new Date()
      let events = ensureTodayEvents(state.medications, state.doseEvents, now)
      events = sweepMissedDoses(events, now)

      const alertLog = [...state.alertLog]
      events = events.map((e) => {
        const med = state.medications.find((m) => m.id === e.medicationId)
        if (!med) return e

        if (isDueForNotification(e, now)) {
          if (state.consents.reminders) {
            showReminderNotification('Medicina reminder', `${med.name} — ${med.dose}`)
          }
          e = { ...e, notifiedAt: now.toISOString() }
        }

        if (isDueForEscalation(e, now)) {
          if (state.consents.smsWhatsappFallback) {
            alertLog.push(
              buildAlert(
                'sms-whatsapp-fallback',
                'patient (self)',
                med.id,
                e.id,
                `Reminder: take ${med.name} (${med.dose}). Reply DONE once taken.`,
              ),
            )
          }
          if (state.consents.caregiverAlerts) {
            for (const cg of state.caregivers.filter((c) => c.consentGiven)) {
              alertLog.push(
                buildAlert(
                  'caregiver-alert',
                  cg.phone,
                  med.id,
                  e.id,
                  `${med.name} dose scheduled for ${new Date(e.scheduledFor).toLocaleTimeString()} has not been confirmed yet.`,
                ),
              )
            }
          }
          e = { ...e, escalatedAt: now.toISOString() }
        }

        return e
      })

      if (events === state.doseEvents && alertLog.length === state.alertLog.length) return state
      return { ...state, doseEvents: events, alertLog }
    }
    default:
      return state
  }
}

interface Ctx {
  state: AppState
  setConsents: (c: ConsentState) => void
  addMedication: (m: Omit<Medication, 'id' | 'createdAt'>) => void
  updateMedication: (id: string, patch: Partial<Medication>) => void
  deleteMedication: (id: string) => void
  recordDose: (id: string, status: DoseStatus) => void
  addCaregiver: (c: Omit<Caregiver, 'id' | 'createdAt'>) => void
  updateCaregiver: (id: string, patch: Partial<Caregiver>) => void
  deleteCaregiver: (id: string) => void
  eraseAll: () => void
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, () => loadState())
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    saveState(state)
  }, [state])

  useEffect(() => {
    dispatch({ type: 'TICK' })
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (state.consents.reminders) {
      requestNotificationPermission()
    }
  }, [state.consents.reminders])

  const value = useMemo<Ctx>(
    () => ({
      state,
      setConsents: (c) => dispatch({ type: 'SET_CONSENTS', consents: c }),
      addMedication: (m) =>
        dispatch({ type: 'ADD_MEDICATION', medication: { ...m, id: newId(), createdAt: new Date().toISOString() } }),
      updateMedication: (id, patch) => dispatch({ type: 'UPDATE_MEDICATION', id, patch }),
      deleteMedication: (id) => dispatch({ type: 'DELETE_MEDICATION', id }),
      recordDose: (id, status) => dispatch({ type: 'RECORD_DOSE', id, status }),
      addCaregiver: (c) =>
        dispatch({ type: 'ADD_CAREGIVER', caregiver: { ...c, id: newId(), createdAt: new Date().toISOString() } }),
      updateCaregiver: (id, patch) => dispatch({ type: 'UPDATE_CAREGIVER', id, patch }),
      deleteCaregiver: (id) => dispatch({ type: 'DELETE_CAREGIVER', id }),
      eraseAll: () => {
        eraseAllData()
        dispatch({ type: 'REPLACE_STATE', state: INITIAL_STATE })
      },
    }),
    [state],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): Ctx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

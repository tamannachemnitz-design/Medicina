export type Frequency = 'once-daily' | 'twice-daily' | 'three-times-daily' | 'custom'

export interface Medication {
  id: string
  name: string
  dose: string
  frequency: Frequency
  times: string[] // "HH:MM", 24h
  notes?: string
  active: boolean
  createdAt: string
}

export type DoseStatus = 'pending' | 'taken' | 'skipped' | 'snoozed' | 'missed'

export interface DoseEvent {
  id: string
  medicationId: string
  scheduledFor: string // ISO datetime
  status: DoseStatus
  actedAt?: string
  notifiedAt?: string
  escalatedAt?: string
}

export interface Caregiver {
  id: string
  name: string
  phone: string
  consentGiven: boolean
  createdAt: string
}

export interface ConsentState {
  essentialStorage: boolean
  reminders: boolean
  caregiverAlerts: boolean
  smsWhatsappFallback: boolean
  consentedAt?: string
}

export type AlertChannel = 'push' | 'sms-whatsapp-fallback' | 'caregiver-alert'

export type AlertDelivery = 'sent' | 'failed' | 'logged'

export interface AlertLogEntry {
  id: string
  channel: AlertChannel
  medicationId: string
  doseEventId: string
  target: string
  message: string
  delivery: AlertDelivery
  sentAt: string
}

export interface User {
  id: string
  email: string
  phone: string | null
  consents: ConsentState
}

export interface AppState {
  medications: Medication[]
  doseEvents: DoseEvent[] // today only
  history: DoseEvent[] // last ~90 days, for streaks/adherence/export
  caregivers: Caregiver[]
  alertLog: AlertLogEntry[]
}

export const DEFAULT_CONSENTS: ConsentState = {
  essentialStorage: false,
  reminders: false,
  caregiverAlerts: false,
  smsWhatsappFallback: false,
}

export const INITIAL_STATE: AppState = {
  medications: [],
  doseEvents: [],
  history: [],
  caregivers: [],
  alertLog: [],
}

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

export interface AlertLogEntry {
  id: string
  channel: AlertChannel
  medicationId: string
  doseEventId: string
  target: string
  message: string
  sentAt: string
}

export interface AppState {
  onboarded: boolean
  consents: ConsentState
  medications: Medication[]
  doseEvents: DoseEvent[]
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
  onboarded: false,
  consents: DEFAULT_CONSENTS,
  medications: [],
  doseEvents: [],
  caregivers: [],
  alertLog: [],
}

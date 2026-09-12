import type { AlertLog, Caregiver, DoseEvent, Medication, User } from '@prisma/client'

export function serializeUser(u: User) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    consents: {
      essentialStorage: u.consentEssentialStorage,
      reminders: u.consentReminders,
      caregiverAlerts: u.consentCaregiverAlerts,
      smsWhatsappFallback: u.consentSmsWhatsappFallback,
      consentedAt: u.consentedAt?.toISOString(),
    },
  }
}

export function serializeMedication(m: Medication) {
  return {
    id: m.id,
    name: m.name,
    dose: m.dose,
    frequency: m.frequency,
    times: JSON.parse(m.times) as string[],
    notes: m.notes ?? undefined,
    active: m.active,
    createdAt: m.createdAt.toISOString(),
  }
}

export function serializeDoseEvent(e: DoseEvent) {
  return {
    id: e.id,
    medicationId: e.medicationId,
    scheduledFor: e.scheduledFor.toISOString(),
    status: e.status,
    actedAt: e.actedAt?.toISOString(),
    notifiedAt: e.notifiedAt?.toISOString(),
    escalatedAt: e.escalatedAt?.toISOString(),
  }
}

export function serializeCaregiver(c: Caregiver) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    consentGiven: c.consentGiven,
    createdAt: c.createdAt.toISOString(),
  }
}

export function serializeAlert(a: AlertLog) {
  return {
    id: a.id,
    channel: a.channel,
    medicationId: a.medicationId,
    doseEventId: a.doseEventId,
    target: a.target,
    message: a.message,
    delivery: a.delivery,
    sentAt: a.sentAt.toISOString(),
  }
}

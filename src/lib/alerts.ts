import type { AlertChannel, AlertLogEntry } from '../types'
import { newId } from './storage'

/**
 * Stub delivery layer for the SMS/WhatsApp fallback and caregiver-alert wedge features
 * (competitive analysis §5.2, §6.3, §6.5). No real gateway is wired up for the MVP —
 * sending real texts needs a licensed provider (e.g. Twilio) and its own reliability
 * testing before launch. This logs what *would* be sent so the flow is demoable end
 * to end and the integration point is obvious.
 */
export function buildAlert(
  channel: AlertChannel,
  target: string,
  medicationId: string,
  doseEventId: string,
  message: string,
): AlertLogEntry {
  return {
    id: newId(),
    channel,
    medicationId,
    doseEventId,
    target,
    message,
    sentAt: new Date().toISOString(),
  }
}

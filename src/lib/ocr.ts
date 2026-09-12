import { createWorker } from 'tesseract.js'

/** Runs on-device OCR (no photo ever leaves the browser) over a captured label image. */
export async function recognizeLabelText(imageDataUrl: string): Promise<string> {
  const worker = await createWorker('eng')
  try {
    const {
      data: { text },
    } = await worker.recognize(imageDataUrl)
    return text
  } finally {
    await worker.terminate()
  }
}

const DOSE_PATTERN = /\b\d+(?:[.,]\d+)?\s?(?:mg|mcg|µg|g|ml|iu)\b/i

export interface ParsedLabel {
  name?: string
  dose?: string
}

/**
 * Very rough heuristic label parser: the recognized text rarely maps cleanly onto
 * "name" + "dose" fields, so this just gives the form a best-effort starting point
 * for the user to correct rather than attempting full label understanding.
 */
export function parseLabelText(text: string): ParsedLabel {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const doseLine = lines.find((l) => DOSE_PATTERN.test(l))
  const doseMatch = doseLine?.match(DOSE_PATTERN)

  const nameCandidate = lines.find((l) => l.length >= 3 && !DOSE_PATTERN.test(l) && /[a-zA-Z]{3,}/.test(l))

  return {
    name: nameCandidate,
    dose: doseMatch?.[0],
  }
}

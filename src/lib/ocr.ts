import { createWorker, PSM } from 'tesseract.js'

/** Runs on-device OCR (no photo ever leaves the browser) over a captured label image. */
export async function recognizeLabelText(imageDataUrl: string): Promise<string> {
  const worker = await createWorker('eng')
  try {
    // Pharmacy labels are usually a few scattered text blocks (name, dose,
    // manufacturer, warnings) at different sizes rather than one uniform
    // paragraph, so SPARSE_TEXT segments much better than the AUTO default.
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })
    const {
      data: { text },
    } = await worker.recognize(imageDataUrl)
    return text
  } finally {
    await worker.terminate()
  }
}

/**
 * Converts a captured frame to high-contrast black-and-white before OCR.
 * Tesseract is far more accurate on binarized text than on a raw glossy
 * color photo — this is the single biggest lever against garbled/misread
 * characters, more so than any post-hoc text cleanup could be.
 */
export function preprocessForOcr(source: HTMLCanvasElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = source.width
  canvas.height = source.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(source, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData
  const pixelCount = data.length / 4
  const gray = new Uint8ClampedArray(pixelCount)
  const histogram = new Array(256).fill(0)

  for (let i = 0; i < pixelCount; i++) {
    const v = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
    gray[i] = v
    histogram[gray[i]]++
  }

  // Otsu's method: pick the threshold that best splits foreground/background.
  let sum = 0
  for (let t = 0; t < 256; t++) sum += t * histogram[t]
  let sumB = 0
  let weightB = 0
  let maxVariance = 0
  let threshold = 128
  for (let t = 0; t < 256; t++) {
    weightB += histogram[t]
    if (weightB === 0) continue
    const weightF = pixelCount - weightB
    if (weightF === 0) break
    sumB += t * histogram[t]
    const meanB = sumB / weightB
    const meanF = (sum - sumB) / weightF
    const variance = weightB * weightF * (meanB - meanF) ** 2
    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  for (let i = 0; i < pixelCount; i++) {
    const v = gray[i] > threshold ? 255 : 0
    data[i * 4] = v
    data[i * 4 + 1] = v
    data[i * 4 + 2] = v
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
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

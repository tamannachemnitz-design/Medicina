import { useEffect, useRef, useState } from 'react'
import { parseLabelText, preprocessForOcr, recognizeLabelText } from '../lib/ocr'
import type { ParsedLabel } from '../lib/ocr'

interface Props {
  onClose: () => void
  onCaptured: (photoDataUrl: string, parsed: ParsedLabel) => void
}

/**
 * Camera capture + on-device OCR for the "scan-to-add" wedge feature
 * (competitive analysis §5.2). Runs entirely in the browser via tesseract.js —
 * no photo or recognized text is sent anywhere, keeping the privacy-first
 * story intact. Label text recognition is inherently noisy on small,
 * curved, or glossy pharmacy labels, so this only pre-fills a best guess;
 * the medication form always opens for the user to confirm or correct it.
 */
export default function ScanToAdd({ onClose, onCaptured }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'camera' | 'reading'>('camera')
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setError('Camera unavailable. You can still add the medication manually below.'))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capture = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85)

    setStatus('reading')
    try {
      const ocrInput = preprocessForOcr(canvas)
      const text = await recognizeLabelText(ocrInput)
      onCaptured(photoDataUrl, parseLabelText(text))
    } catch {
      onCaptured(photoDataUrl, {})
    }
  }

  return (
    <div className="modal-backdrop" onClick={status === 'reading' ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Scan medication label</h2>
        {error ? (
          <p className="muted">{error}</p>
        ) : status === 'reading' ? (
          <p className="muted">Reading label on-device… this can take a few seconds.</p>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="scan-preview" />
            <p className="muted small">
              Point the camera at the bottle or box label, then capture. Text recognition runs on your device and
              gives a best-effort guess — you'll get a chance to fix anything it misreads.
            </p>
          </>
        )}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose} disabled={status === 'reading'}>
            Cancel
          </button>
          {!error && status === 'camera' && (
            <button className="primary" onClick={capture}>
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

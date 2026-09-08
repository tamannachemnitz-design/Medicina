import { useEffect, useRef, useState } from 'react'

interface Props {
  onClose: () => void
  onCaptured: (photoDataUrl: string) => void
}

/**
 * Camera capture for the "scan-to-add" wedge feature (competitive analysis §5.2).
 * Label/barcode OCR is a real, non-trivial integration (on-device ML model or a
 * cloud OCR API) that's out of scope for this MVP — this component wires up the
 * camera and capture flow, then hands the photo back so the medication form can
 * be pre-opened for manual entry. Swapping in real text recognition later only
 * means replacing `onCaptured`'s consumer, not this component.
 */
export default function ScanToAdd({ onClose, onCaptured }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' } })
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

  const capture = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    onCaptured(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Scan medication label</h2>
        {error ? (
          <p className="muted">{error}</p>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="scan-preview" />
            <p className="muted small">
              Point the camera at the bottle or box label, then capture. Automatic label reading isn’t built yet
              in this MVP — capturing a photo will open the form below so you can enter the details in a few
              seconds.
            </p>
          </>
        )}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
          {!error && (
            <button className="primary" onClick={capture}>
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

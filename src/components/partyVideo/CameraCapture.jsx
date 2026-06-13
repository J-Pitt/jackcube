'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { requestUserMedia } from '@/lib/media'

/**
 * In-app camera for taking a NEW photo (no gallery / upload). Uses getUserMedia
 * and a canvas snapshot, downscaled hard so it can ride inline through chat.
 * Calls onCapture(dataUrl) when the user sends; onClose to dismiss.
 */
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [facing, setFacing] = useState('user')
  const [error, setError] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const start = useCallback(async () => {
    setError(null)
    stop()
    try {
      const stream = await requestUserMedia({
        audio: false,
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
    } catch (err) {
      setError(err?.message || 'Could not open the camera.')
    }
  }, [facing, stop])

  // (Re)start the live camera unless we're previewing a captured shot.
  useEffect(() => {
    if (photo) return undefined
    start()
    return stop
  }, [start, stop, photo])

  useEffect(() => stop, [stop])

  function capture() {
    const video = videoRef.current
    if (!video?.videoWidth) return
    const maxDim = 900
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight))
    const w = Math.round(video.videoWidth * scale)
    const h = Math.round(video.videoHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (facing === 'user') {
      // Mirror selfies so the saved shot matches the preview.
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, w, h)
    setPhoto(canvas.toDataURL('image/jpeg', 0.6))
    stop()
  }

  async function send() {
    if (!photo || busy) return
    setBusy(true)
    try {
      await onCapture(photo)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-white/70 hover:text-white"
        >
          Cancel
        </button>
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
          Take a photo
        </span>
        {!photo ? (
          <button
            type="button"
            onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            className="text-sm font-semibold text-white/70 hover:text-white"
          >
            Flip
          </button>
        ) : (
          <span className="w-10" />
        )}
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {error ? (
          <p className="max-w-xs px-6 text-center text-sm text-cube-danger">{error}</p>
        ) : photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="preview" className="max-h-full max-w-full object-contain" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-full max-w-full object-contain"
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-6 px-4 py-6">
        {error ? (
          <button
            type="button"
            onClick={start}
            className="rounded-xl bg-cube-violet px-6 py-3 font-bold text-white"
          >
            Try again
          </button>
        ) : photo ? (
          <>
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="rounded-xl border border-white/25 px-6 py-3 font-bold text-white"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={send}
              disabled={busy}
              className="rounded-xl bg-cube-cyan px-8 py-3 font-bold text-cube-bg disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send to chat'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={capture}
            aria-label="Capture"
            className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition active:scale-90"
          />
        )}
      </div>
    </div>
  )
}

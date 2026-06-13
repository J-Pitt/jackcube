'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { describeMediaError, requestUserMedia } from '@/lib/media'

const MAX_VIDEO_SECONDS = 6
const VIDEO_MIME_CANDIDATES = [
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]

function pickVideoMime() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const m of VIDEO_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported?.(m)) return m
  }
  return ''
}

function streamHasVideo(stream) {
  return !!stream && stream.getVideoTracks?.().length > 0
}

/**
 * In-app camera for capturing a NEW photo or short video (no gallery/upload).
 * Uses getUserMedia; photos snapshot a canvas, videos use MediaRecorder capped
 * short. Calls onCapture(dataUrl, kind) where kind is 'image' | 'video'.
 *
 * If `existingStream` (a live party-video stream with a camera track) is passed,
 * it is reused instead of opening a second camera — mobile browsers (esp. iOS
 * Safari) reject a concurrent getUserMedia with NotAllowedError.
 */
export default function CameraCapture({ onCapture, onClose, existingStream }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const ownsStreamRef = useRef(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const canReuse = streamHasVideo(existingStream)

  const [mode, setMode] = useState('photo')
  const [facing, setFacing] = useState('user')
  const [error, setError] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [videoData, setVideoData] = useState(null)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [busy, setBusy] = useState(false)

  const videoSupported = pickVideoMime() !== null
  const hasPreview = !!photo || !!videoData

  const stop = useCallback(() => {
    // Only stop tracks we acquired — a reused party stream stays alive.
    if (streamRef.current && ownsStreamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }
    streamRef.current = null
    ownsStreamRef.current = false
  }, [])

  const start = useCallback(async () => {
    setError(null)
    stop()
    try {
      let stream
      if (streamHasVideo(existingStream)) {
        // Reuse the live party-video camera instead of opening a second one.
        stream = existingStream
        ownsStreamRef.current = false
      } else {
        stream = await requestUserMedia({
          audio: mode === 'video',
          video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 640 } },
        })
        ownsStreamRef.current = true
      }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
      }
    } catch (err) {
      setError(describeMediaError(err))
    }
  }, [facing, mode, stop, existingStream])

  // Run the live camera unless we're previewing a captured shot/clip.
  useEffect(() => {
    if (hasPreview) return undefined
    start()
    return stop
  }, [start, stop, hasPreview])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stop()
    }
  }, [stop])

  function capturePhoto() {
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
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, w, h)
    setPhoto(canvas.toDataURL('image/jpeg', 0.6))
    stop()
  }

  function startRecording() {
    const stream = streamRef.current
    if (!stream) return
    const mimeType = pickVideoMime()
    let recorder
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 700_000,
        audioBitsPerSecond: 64_000,
      })
    } catch {
      try {
        recorder = new MediaRecorder(stream)
      } catch {
        setError('Video recording is not supported on this browser.')
        return
      }
    }
    chunksRef.current = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' })
      const reader = new FileReader()
      reader.onloadend = () => {
        setVideoData(reader.result)
        stop()
      }
      reader.readAsDataURL(blob)
    }
    recorderRef.current = recorder
    recorder.start()
    setRecording(true)
    setElapsed(0)
    const startedAt = Date.now()
    timerRef.current = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000
      setElapsed(s)
      if (s >= MAX_VIDEO_SECONDS) stopRecording()
    }, 100)
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setRecording(false)
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  function retake() {
    setPhoto(null)
    setVideoData(null)
  }

  async function send() {
    if (busy) return
    const data = photo || videoData
    if (!data) return
    setBusy(true)
    try {
      await onCapture(data, photo ? 'image' : 'video')
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
        {!hasPreview && !recording && videoSupported ? (
          <div className="flex overflow-hidden rounded-full border border-white/20 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('photo')}
              className={`px-3 py-1 ${mode === 'photo' ? 'bg-white text-black' : 'text-white/70'}`}
            >
              Photo
            </button>
            <button
              type="button"
              onClick={() => setMode('video')}
              className={`px-3 py-1 ${mode === 'video' ? 'bg-white text-black' : 'text-white/70'}`}
            >
              Video
            </button>
          </div>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
            {recording ? `Recording ${Math.ceil(MAX_VIDEO_SECONDS - elapsed)}s` : 'Preview'}
          </span>
        )}
        {!hasPreview && !recording && !canReuse ? (
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
        ) : videoData ? (
          <video
            src={videoData}
            controls
            playsInline
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="max-h-full max-w-full object-contain"
            style={{ transform: facing === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}
        {recording && (
          <span className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-cube-danger" />
            {elapsed.toFixed(1)}s
          </span>
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
        ) : hasPreview ? (
          <>
            <button
              type="button"
              onClick={retake}
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
        ) : mode === 'photo' ? (
          <button
            type="button"
            onClick={capturePhoto}
            aria-label="Capture photo"
            className="h-16 w-16 rounded-full border-4 border-white bg-white/20 transition active:scale-90"
          />
        ) : recording ? (
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-cube-danger bg-cube-danger/30"
          >
            <span className="h-6 w-6 rounded bg-cube-danger" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            aria-label="Start recording"
            className="h-16 w-16 rounded-full border-4 border-white bg-cube-danger transition active:scale-90"
          />
        )}
      </div>
    </div>
  )
}

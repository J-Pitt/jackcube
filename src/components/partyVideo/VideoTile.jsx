'use client'

import { useCallback, useEffect, useRef } from 'react'
import { hasVideoTrack } from '@/lib/media'
import { attachStream } from '@/lib/partyVideo'

export default function VideoTile({ name, stream, color, size = 'default' }) {
  const videoRef = useRef(null)

  const setRef = useCallback(
    (el) => {
      videoRef.current = el
      if (el && stream && hasVideoTrack(stream)) attachStream(el, stream)
    },
    [stream]
  )

  useEffect(() => {
    if (videoRef.current && stream && hasVideoTrack(stream)) {
      attachStream(videoRef.current, stream)
    }
  }, [stream])

  const sizeClass =
    size === 'hero'
      ? 'aspect-video min-h-[220px] sm:min-h-[280px]'
      : size === 'large'
        ? 'aspect-video min-h-[140px] sm:min-h-[180px]'
        : 'aspect-video min-h-[100px]'

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 bg-cube-surface ${sizeClass}`}
      style={{ borderColor: color || '#6C5CE7' }}
    >
      {hasVideoTrack(stream) ? (
        <video ref={setRef} autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center bg-cube-surface text-2xl">🎤</div>
      )}
      <span className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-xs font-medium text-white">
        {name}
      </span>
    </div>
  )
}

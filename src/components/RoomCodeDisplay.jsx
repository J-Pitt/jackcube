'use client'

import { QRCodeSVG } from 'qrcode.react'
import { buildJoinUrl } from '@/lib/roomApi'

export default function RoomCodeDisplay({ gameCode, mode }) {
  const joinUrl = buildJoinUrl(gameCode)

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="rounded-2xl bg-white p-3 shadow-lg shadow-cube-violet/20">
        <QRCodeSVG value={joinUrl} size={140} level="M" includeMargin={false} />
      </div>
      <div className="text-center sm:text-left">
        <p className="text-sm uppercase tracking-widest text-white/50">Room code</p>
        <p className="font-display text-5xl font-extrabold tracking-[0.2em] text-cube-cyan">
          {gameCode}
        </p>
        <p className="mt-2 text-sm text-white/60">
          {mode === 'local'
            ? 'Same WiFi — scan to join on your phone'
            : 'Share the link or code with friends anywhere'}
        </p>
        <a
          href={joinUrl}
          className="mt-3 inline-block break-all text-sm text-cube-violet hover:underline"
        >
          {joinUrl}
        </a>
      </div>
    </div>
  )
}

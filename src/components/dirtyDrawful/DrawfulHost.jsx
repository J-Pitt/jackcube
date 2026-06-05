'use client'

import { useCallback, useEffect, useState } from 'react'
import { advanceGame, nextRound } from '@/lib/roomApi'
import { useStepTimer } from '@/hooks/useStepTimer'
import {
  AnimatePhase,
  CountdownOverlay,
  GameHeader,
  LeaderboardPhase,
  PhaseTimer,
} from '@/components/PartyGameLayout'

function DrawingPreview({ strokes }) {
  const w = 640
  const h = 360
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto w-full max-w-2xl rounded-xl bg-[#1a1a2e]">
      {(strokes || []).map((stroke, i) => {
        if (!stroke?.points?.length) return null
        const d = stroke.points
          .map((pt, j) => `${j === 0 ? 'M' : 'L'} ${pt.x * (w / 400)} ${pt.y * (h / 300)}`)
          .join(' ')
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={stroke.color || '#fff'}
            strokeWidth={stroke.width || 4}
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

export default function DrawfulHost({ room, roomId, hostId, refresh }) {
  const [countdown, setCountdown] = useState(null)
  const phase = room?.phase
  const dd = room?.gameState?.dirtyDrawful
  const players = room?.players || []
  const drawer = players.find((p) => p.id === dd?.drawerId)

  useEffect(() => {
    if (phase !== 'countdown' || !hostId) return undefined
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((c) => (c <= 1 ? null : c - 1))
    }, 1000)
    const timeout = setTimeout(() => {
      advanceGame(roomId, hostId).then(() => refresh()).catch(() => {})
    }, 3200)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [phase, roomId, hostId, refresh, room?.gameState?.round])

  useStepTimer({
    enabled: phase === 'playing' && !!dd?.endsAt,
    endsAt: dd?.endsAt,
    roomId,
    hostId,
    onAdvanced: () => refresh(),
  })

  const handleNextRound = useCallback(async () => {
    await nextRound(roomId, hostId)
    refresh()
  }, [roomId, hostId, refresh])

  if (phase === 'leaderboard' || phase === 'victory') {
    return (
      <main className="min-h-screen bg-cube-bg px-4 py-6">
        <GameHeader title={phase === 'victory' ? '🎉 Winner!' : '🏆 Round results'} room={room} />
        <div className="mx-auto max-w-5xl">
          <LeaderboardPhase room={room} onNextRound={handleNextRound} showNext={phase === 'leaderboard'} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader
        title="🦉 Dirty Drawful"
        room={room}
        subtitle={`Round ${room?.gameState?.round ?? 1}`}
      />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_240px]">
        <div>
          {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}
          {phase === 'playing' && dd && (
            <AnimatePhase phaseKey={dd.step}>
              {dd.step === 'assign' && (
                <p className="text-center text-2xl text-white">
                  <span style={{ color: drawer?.color }}>{drawer?.name}</span> is drawing…
                  <PhaseTimer endsAt={dd.endsAt} label="Draw starts in" />
                </p>
              )}
              {(dd.step === 'draw' || dd.step === 'guess') && (
                <>
                  <DrawingPreview strokes={dd.strokes} />
                  <p className="mt-4 text-center text-white/60">
                    {dd.step === 'draw' ? 'Drawing in progress…' : 'Type your guesses on phones!'}
                  </p>
                  <PhaseTimer endsAt={dd.endsAt} label="Time left" />
                </>
              )}
              {dd.step === 'reveal' && (
                <div className="text-center">
                  <DrawingPreview strokes={dd.strokes} />
                  <p className="mt-4 text-sm text-cube-violet">Prompt</p>
                  <p className="font-display text-3xl text-white">{dd.promptText}</p>
                  <p className="mt-4 text-cube-cyan">
                    Correct:{' '}
                    {(dd.correctGuessers || [])
                      .map((id) => players.find((p) => p.id === id)?.name)
                      .filter(Boolean)
                      .join(', ') || 'nobody'}
                  </p>
                </div>
              )}
            </AnimatePhase>
          )}
        </div>
        <aside className="rounded-2xl border border-cube-violet/30 bg-cube-surface/80 p-4">
          <p className="text-4xl">🦉</p>
          <p className="mt-2 text-sm italic text-white/70">{dd?.hostLine || 'The owl is watching.'}</p>
        </aside>
      </div>
    </main>
  )
}

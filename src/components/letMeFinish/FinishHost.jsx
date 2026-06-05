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

export default function FinishHost({ room, roomId, hostId, refresh }) {
  const [countdown, setCountdown] = useState(null)
  const phase = room?.phase
  const lmf = room?.gameState?.letMeFinish
  const players = room?.players || []
  const presenter = players.find((p) => p.id === lmf?.presenterId)

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
    enabled: phase === 'playing' && !!lmf?.endsAt,
    endsAt: lmf?.endsAt,
    roomId,
    hostId,
    onAdvanced: () => refresh(),
  })

  const handleNextRound = useCallback(async () => {
    await nextRound(roomId, hostId)
    refresh()
  }, [roomId, hostId, refresh])

  const voteTally = {}
  Object.values(lmf?.votes || {}).forEach((id) => {
    voteTally[id] = (voteTally[id] || 0) + 1
  })

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
        title="🎤 Let Me Finish"
        room={room}
        subtitle={`Round ${room?.gameState?.round ?? 1} · Presenter: ${presenter?.name || '…'}`}
      />
      <div className="mx-auto max-w-3xl">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}
        {phase === 'playing' && lmf && (
          <AnimatePhase phaseKey={lmf.step}>
            <div className="rounded-2xl border border-white/10 bg-cube-surface/80 p-8">
              <p className="font-display text-2xl font-bold leading-snug text-white">
                {lmf.questionText}
              </p>
              {lmf.step === 'question' && (
                <p className="mt-4 text-white/50">Presenter: start pitch on your phone.</p>
              )}
              {lmf.step === 'pitch' && (
                <p className="mt-4 text-cube-cyan">
                  {presenter?.name} is pitching — challengers, fire objections!
                </p>
              )}
              {lmf.step === 'rebuttal' && lmf.rebuttalText && (
                <p className="mt-4 rounded-lg bg-white/5 p-4 italic text-white/80">
                  Rebuttal: {lmf.rebuttalText}
                </p>
              )}
              {lmf.step === 'vote' && (
                <div className="mt-6 space-y-2">
                  {players.map((p) => (
                    <div key={p.id} className="flex justify-between rounded-lg bg-white/5 px-4 py-2">
                      <span style={{ color: p.color }}>{p.name}</span>
                      <span>{voteTally[p.id] || 0}</span>
                    </div>
                  ))}
                </div>
              )}
              <PhaseTimer endsAt={lmf.endsAt} label="Phase ends in" />
              {(lmf.objections || []).length > 0 && (
                <div className="mt-6 overflow-hidden rounded-lg border border-cube-violet/30 bg-black/30 p-2">
                  <p className="text-xs uppercase text-white/40">Ticker</p>
                  <div className="mt-1 space-y-1 text-sm text-white/80">
                    {lmf.objections.slice(-5).map((o, i) => (
                      <p key={i}>
                        <span style={{ color: players.find((p) => p.id === o.playerId)?.color }}>
                          {players.find((p) => p.id === o.playerId)?.name}:
                        </span>{' '}
                        {o.text}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnimatePhase>
        )}
      </div>
    </main>
  )
}

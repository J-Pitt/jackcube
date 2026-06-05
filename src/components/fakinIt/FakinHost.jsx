'use client'

import { useCallback, useState } from 'react'
import { advanceGame, nextRound } from '@/lib/roomApi'
import { useStepTimer } from '@/hooks/useStepTimer'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import {
  AnimatePhase,
  CountdownOverlay,
  GameHeader,
  LeaderboardPhase,
  PhaseTimer,
} from '@/components/PartyGameLayout'

export default function FakinHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const fi = room?.gameState?.fakinIt
  const players = room?.players || []

  const countdown = useGameCountdown({
    phase,
    round,
    roomId,
    hostId,
    onDone: refresh,
  })

  useStepTimer({
    enabled: phase === 'playing' && !!fi?.endsAt,
    endsAt: fi?.endsAt,
    roomId,
    hostId,
    onAdvanced: () => refresh(),
  })

  const handleNextRound = useCallback(async () => {
    if (nextLoading) return
    setNextLoading(true)
    try {
      await nextRound(roomId, hostId)
      refresh()
    } finally {
      setNextLoading(false)
    }
  }, [roomId, hostId, refresh, nextLoading])

  const handleForceAdvance = useCallback(async () => {
    await advanceGame(roomId, hostId)
    refresh()
  }, [roomId, hostId, refresh])

  const voteTally = {}
  Object.values(fi?.votes || {}).forEach((id) => {
    voteTally[id] = (voteTally[id] || 0) + 1
  })

  const fakerPlayer = players.find((p) => p.id === fi?.fakerId)

  if (phase === 'leaderboard' || phase === 'victory') {
    return (
      <main className="min-h-screen bg-cube-bg px-4 py-6">
        <GameHeader
          title={phase === 'victory' ? '🎉 Winner!' : '🏆 Round results'}
          room={room}
          subtitle={`Round ${room?.gameState?.round ?? ''}`}
        />
        <div className="mx-auto max-w-5xl">
          <LeaderboardPhase
            room={room}
            onNextRound={handleNextRound}
            showNext={phase === 'leaderboard'}
            nextLoading={nextLoading}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader
        title="🎭 Fakin' It All Night Long"
        room={room}
        subtitle={`Round ${room?.gameState?.round ?? 1} · ${fi?.step || '…'}`}
      />
      <div className="mx-auto max-w-3xl text-center">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

        {phase === 'playing' && fi && (
          <AnimatePhase phaseKey={`${round}-${fi.step}`}>
            <div className="rounded-2xl border border-white/10 bg-cube-surface/80 p-8">
              {fi.step === 'prompt' && (
                <>
                  <p className="text-xl text-white">Read your secret prompt on your phone.</p>
                  <p className="mt-2 text-white/50">Then perform when the timer switches.</p>
                  <PhaseTimer endsAt={fi.endsAt} label="Starting action in" />
                </>
              )}
              {fi.step === 'action' && (
                <>
                  <p className="font-display text-3xl font-bold text-cube-cyan">
                    Everyone: follow your secret prompt now!
                  </p>
                  {fi.remotePlay && (
                    <p className="mt-2 text-sm text-white/50">Remote: use gesture buttons on phones</p>
                  )}
                  <PhaseTimer endsAt={fi.endsAt} label="Time left" />
                </>
              )}
              {fi.step === 'vote' && (
                <>
                  <p className="text-2xl font-bold text-white">Who is the Faker?</p>
                  <p className="mt-2 text-white/50">Vote on your phones.</p>
                  <PhaseTimer endsAt={fi.endsAt} label="Voting ends in" />
                  <div className="mt-6 space-y-2">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between rounded-lg bg-white/5 px-4 py-2"
                      >
                        <span style={{ color: p.color }}>{p.name}</span>
                        <span className="text-cube-cyan">{voteTally[p.id] || 0} votes</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {fi.step === 'reveal' && (
                <>
                  <p className="text-sm uppercase text-cube-violet">The real prompt was</p>
                  <p className="mt-2 font-display text-2xl text-white">{fi.promptText}</p>
                  <p className="mt-6 text-xl">
                    The Faker was{' '}
                    <span className="font-bold text-cube-danger">{fakerPlayer?.name}</span>
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={handleForceAdvance}
                className="mt-8 text-sm text-white/30 hover:text-white/60"
              >
                Host: skip timer →
              </button>
            </div>
          </AnimatePhase>
        )}
      </div>
    </main>
  )
}

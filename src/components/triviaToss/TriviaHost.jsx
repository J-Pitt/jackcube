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

export default function TriviaHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const tt = room?.gameState?.triviaToss
  const players = room?.players || []

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!tt?.endsAt,
    endsAt: tt?.endsAt,
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

  if (phase === 'leaderboard' || phase === 'victory') {
    return (
      <main className="min-h-screen bg-cube-bg px-4 py-6">
        <GameHeader title={phase === 'victory' ? '🎉 Winner!' : '🏆 Round results'} room={room} />
        <div className="mx-auto max-w-5xl">
          <LeaderboardPhase room={room} onNextRound={handleNextRound} showNext={phase === 'leaderboard'} nextLoading={nextLoading} />
        </div>
      </main>
    )
  }

  const labels = ['A', 'B', 'C', 'D']

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader title="🧠 Trivia Toss" room={room} subtitle={`Round ${round}`} />
      <div className="mx-auto max-w-3xl text-center">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}
        {phase === 'playing' && tt && (
          <AnimatePhase phaseKey={`${round}-${tt.step}`}>
            <div className="rounded-2xl border border-cube-cyan/30 bg-cube-surface/80 p-8">
              {tt.step === 'question' && (
                <>
                  <p className="text-sm uppercase text-white/40">Answer on your phone</p>
                  <p className="mt-4 font-display text-3xl font-bold text-white">{tt.questionText}</p>
                  <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                    {(tt.options || []).map((opt, i) => (
                      <div key={opt} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <span className="font-bold text-cube-cyan">{labels[i]}.</span> {opt}
                      </div>
                    ))}
                  </div>
                  <PhaseTimer endsAt={tt.endsAt} label="Time left" />
                </>
              )}
              {tt.step === 'reveal' && (
                <>
                  <p className="text-sm uppercase text-cube-cyan">Correct answer</p>
                  <p className="mt-2 text-lg text-white/60">{tt.questionText}</p>
                  <p className="mt-4 font-display text-4xl font-bold text-cube-cyan">
                    {labels[tt.correctIndex]}. {(tt.options || [])[tt.correctIndex]}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {players.map((p) => {
                      const pick = tt.answers?.[p.id]
                      const correct = pick === tt.correctIndex
                      return (
                        <span
                          key={p.id}
                          className={`rounded-full px-3 py-1 text-sm ${correct ? 'bg-cube-cyan/20 text-cube-cyan' : 'bg-white/10 text-white/50'}`}
                        >
                          {p.name} {correct ? '✓' : '✗'}
                        </span>
                      )
                    })}
                  </div>
                </>
              )}
              <button type="button" onClick={handleForceAdvance} className="mt-8 text-sm text-white/30 hover:text-white/60">
                Host: skip timer →
              </button>
            </div>
          </AnimatePhase>
        )}
      </div>
    </main>
  )
}

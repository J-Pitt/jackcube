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

export default function BluffHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const bb = room?.gameState?.bluffBox
  const players = room?.players || []

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!bb?.endsAt,
    endsAt: bb?.endsAt,
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

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader title="🎭 Bluff Box" room={room} subtitle={`Round ${round}`} />
      <div className="mx-auto max-w-3xl text-center">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}
        {phase === 'playing' && bb && (
          <AnimatePhase phaseKey={`${round}-${bb.step}`}>
            <div className="rounded-2xl border border-cube-violet/30 bg-cube-surface/80 p-8">
              {bb.step === 'write' && (
                <>
                  <p className="text-sm uppercase text-white/40">Write a convincing lie on your phone</p>
                  <p className="mt-4 font-display text-2xl font-bold text-white">{bb.promptText}</p>
                  <PhaseTimer endsAt={bb.endsAt} label="Time left" />
                </>
              )}
              {bb.step === 'guess' && (
                <>
                  <p className="text-sm uppercase text-white/40">Which is the real answer?</p>
                  <p className="mt-2 text-lg text-white/60">{bb.promptText}</p>
                  <div className="mt-6 space-y-2 text-left">
                    {(bb.choices || []).map((c, i) => (
                      <div key={c.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <span className="text-xs text-white/30">{i + 1}.</span>
                        <p className="mt-1 text-lg text-white">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <PhaseTimer endsAt={bb.endsAt} label="Guessing ends" />
                </>
              )}
              {bb.step === 'reveal' && (
                <>
                  <p className="text-sm uppercase text-cube-cyan">The truth</p>
                  <p className="mt-2 text-lg text-white/60">{bb.promptText}</p>
                  <p className="mt-4 font-display text-4xl font-bold text-cube-cyan">{bb.realAnswer}</p>
                  <div className="mt-6 space-y-2 text-left">
                    {(bb.choices || []).map((c) => {
                      const author = c.authorId ? players.find((p) => p.id === c.authorId) : null
                      return (
                        <div
                          key={c.id}
                          className={`rounded-xl border px-4 py-3 ${c.isReal ? 'border-cube-cyan/50 bg-cube-cyan/10' : 'border-white/10 bg-white/5'}`}
                        >
                          <p className="text-white">{c.text}</p>
                          <p className="mt-1 text-xs text-white/40">
                            {c.isReal ? '✓ Real answer' : `Bluff by ${author?.name || '?'}`}
                          </p>
                        </div>
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

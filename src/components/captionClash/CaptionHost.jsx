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

export default function CaptionHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const cc = room?.gameState?.captionClash
  const players = room?.players || []

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!cc?.endsAt,
    endsAt: cc?.endsAt,
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

  const submissions = cc?.submissions || {}
  const votes = cc?.votes || {}

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader title="💬 Caption Clash" room={room} subtitle={`Round ${round}`} />
      <div className="mx-auto max-w-3xl text-center">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}
        {phase === 'playing' && cc && (
          <AnimatePhase phaseKey={`${round}-${cc.step}`}>
            <div className="rounded-2xl border border-cube-cyan/30 bg-cube-surface/80 p-8">
              {cc.step === 'write' && (
                <>
                  <p className="text-sm uppercase text-white/40">Write on your phone</p>
                  <p className="mt-4 font-display text-3xl font-bold text-white">{cc.promptText}</p>
                  <PhaseTimer endsAt={cc.endsAt} label="Time left" />
                </>
              )}
              {cc.step === 'vote' && (
                <>
                  <p className="text-sm uppercase text-white/40">Vote for the funniest</p>
                  <p className="mt-2 text-lg text-white/60">{cc.promptText}</p>
                  <div className="mt-6 space-y-3 text-left">
                    {Object.entries(submissions).map(([pid, text], i) => (
                      <div key={pid} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <span className="text-xs text-white/30">Answer {i + 1}</span>
                        <p className="mt-1 text-lg text-white">{text}</p>
                      </div>
                    ))}
                  </div>
                  <PhaseTimer endsAt={cc.endsAt} label="Voting ends" />
                </>
              )}
              {cc.step === 'reveal' && (
                <>
                  <p className="text-sm uppercase text-white/40">Results</p>
                  <p className="mt-2 text-lg text-white/60">{cc.promptText}</p>
                  <div className="mt-6 space-y-3 text-left">
                    {Object.entries(submissions).map(([pid, text]) => {
                      const author = players.find((p) => p.id === pid)
                      const voteCount = Object.values(votes).filter((v) => v === pid).length
                      return (
                        <div key={pid} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-lg text-white">{text}</p>
                          <p className="mt-1 text-sm" style={{ color: author?.color }}>
                            {author?.name} · {voteCount} vote{voteCount !== 1 ? 's' : ''}
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

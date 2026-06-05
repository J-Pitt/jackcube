'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
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

export default function ReactionHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const rr = room?.gameState?.reactionRush
  const players = room?.players || []

  const countdown = useGameCountdown({ phase, round, roomId, hostId, onDone: refresh })

  useStepTimer({
    enabled: phase === 'playing' && !!rr?.endsAt,
    endsAt: rr?.endsAt,
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

  const ranked = players
    .filter((p) => !rr?.earlyTappers?.[p.id] && rr?.taps?.[p.id])
    .map((p) => ({ player: p, ts: rr.taps[p.id] }))
    .sort((a, b) => a.ts - b.ts)

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader title="⚡ Reaction Rush" room={room} subtitle={`Round ${round}`} />
      <div className="mx-auto max-w-3xl text-center">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}
        {phase === 'playing' && rr && (
          <AnimatePhase phaseKey={`${round}-${rr.step}`}>
            <div className="rounded-2xl border border-cube-danger/30 bg-cube-surface/80 p-8">
              {rr.step === 'ready' && (
                <>
                  <motion.p
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="font-display text-6xl font-black text-cube-danger"
                  >
                    WAIT…
                  </motion.p>
                  <p className="mt-4 text-white/50">Don&apos;t tap yet!</p>
                  <PhaseTimer endsAt={rr.endsAt} label="Signal in" />
                </>
              )}
              {rr.step === 'go' && (
                <>
                  <motion.p
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="font-display text-7xl font-black text-cube-cyan"
                  >
                    GO!
                  </motion.p>
                  <p className="mt-4 text-white/50">Tap on your phone!</p>
                  <PhaseTimer endsAt={rr.endsAt} label="Window closes" />
                </>
              )}
              {rr.step === 'reveal' && (
                <>
                  <p className="text-sm uppercase text-white/40">Fastest reactions</p>
                  <div className="mt-6 space-y-2 text-left">
                    {ranked.map(({ player, ts }, i) => (
                      <div key={player.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <span className="text-cube-cyan">#{i + 1}</span>{' '}
                        <span style={{ color: player.color }}>{player.name}</span>
                        <span className="ml-2 text-white/40">{((ts - new Date(rr.goAt).getTime()) / 1000).toFixed(2)}s</span>
                      </div>
                    ))}
                    {players.filter((p) => rr.earlyTappers?.[p.id]).map((p) => (
                      <div key={p.id} className="rounded-xl border border-cube-danger/30 bg-cube-danger/5 px-4 py-3 text-cube-danger">
                        {p.name} — too early!
                      </div>
                    ))}
                    {players.filter((p) => !rr.taps?.[p.id] && !rr.earlyTappers?.[p.id]).map((p) => (
                      <div key={p.id} className="rounded-xl border border-white/10 px-4 py-3 text-white/40">
                        {p.name} — no tap
                      </div>
                    ))}
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

'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { advanceGame, nextRound } from '@/lib/roomApi'
import { useStepTimer } from '@/hooks/useStepTimer'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import { CountdownOverlay, LeaderboardPhase } from '@/components/PartyGameLayout'
import {
  GameStage,
  PhaseReveal,
  getAccent,
} from '@/components/game/GameUI'

const ACCENT_KEY = 'reactionRush'

export default function ReactionHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const rr = room?.gameState?.reactionRush
  const players = room?.players || []
  const accent = getAccent(ACCENT_KEY)

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
      <GameStage title="Reaction Rush" emoji="⚡" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
        <LeaderboardPhase
          room={room}
          onNextRound={handleNextRound}
          showNext={phase === 'leaderboard'}
          nextLoading={nextLoading}
        />
      </GameStage>
    )
  }

  const goTime = rr?.goAt ? new Date(rr.goAt).getTime() : null
  const ranked = players
    .filter((p) => !rr?.earlyTappers?.[p.id] && rr?.taps?.[p.id])
    .map((p) => ({ player: p, ts: rr.taps[p.id] }))
    .sort((a, b) => a.ts - b.ts)
  const early = players.filter((p) => rr?.earlyTappers?.[p.id])
  const noTap = players.filter((p) => !rr?.taps?.[p.id] && !rr?.earlyTappers?.[p.id])

  return (
    <GameStage title="Reaction Rush" emoji="⚡" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && rr && (
        <PhaseReveal key={`${round}-${rr.step}`}>
          {rr.step === 'ready' && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <motion.div
                animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.3 }}
                className="font-display text-7xl font-black text-white/80"
              >
                WAIT…
              </motion.div>
              <p className="mt-6 text-lg text-white/50">Hands ready. Don&apos;t tap until you see GO!</p>
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="mt-8 text-3xl"
              >
                ●　●　●
              </motion.div>
            </div>
          )}

          {rr.step === 'go' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <motion.div
                initial={{ scale: 0.6 }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ repeat: Infinity, duration: 0.45 }}
                className="font-display text-9xl font-black"
                style={{ color: accent.hex, textShadow: `0 0 50px ${accent.glow}` }}
              >
                GO!
              </motion.div>
              <p className="mt-6 text-lg text-white/60">Tap your phone — now!</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {players.map((p) => {
                  const tapped = rr.taps?.[p.id] || rr.earlyTappers?.[p.id]
                  return (
                    <span
                      key={p.id}
                      className="rounded-full px-3 py-1 text-sm font-semibold"
                      style={{
                        background: tapped ? `${accent.hex}1f` : 'rgba(255,255,255,0.06)',
                        color: tapped ? accent.hex : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {p.name} {tapped ? '⚡' : '…'}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {rr.step === 'reveal' && (
            <div className="mx-auto max-w-xl space-y-3">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40">
                Fastest reactions
              </p>
              {ranked.map(({ player, ts }, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 rounded-2xl border px-5 py-4"
                  style={{
                    borderColor: i === 0 ? `${accent.hex}66` : 'rgba(255,255,255,0.1)',
                    background: i === 0 ? `${accent.hex}12` : 'rgba(255,255,255,0.04)',
                  }}
                >
                  <span className="w-8 font-display text-xl font-black" style={{ color: accent.hex }}>
                    #{i + 1}
                  </span>
                  <span className="h-3 w-3 rounded-full" style={{ background: player.color }} />
                  <span className="flex-1 font-medium text-white">{player.name}</span>
                  {goTime && (
                    <span className="font-mono text-sm text-white/60">
                      {((ts - goTime) / 1000).toFixed(3)}s
                    </span>
                  )}
                </motion.div>
              ))}
              {early.map((p) => (
                <div key={p.id} className="rounded-2xl border border-cube-danger/30 bg-cube-danger/5 px-5 py-3 text-cube-danger">
                  {p.name} — jumped the gun!
                </div>
              ))}
              {noTap.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/10 px-5 py-3 text-white/40">
                  {p.name} — too slow
                </div>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <button type="button" onClick={handleForceAdvance} className="text-xs text-white/25 hover:text-white/50">
              Host: skip →
            </button>
          </div>
        </PhaseReveal>
      )}
    </GameStage>
  )
}

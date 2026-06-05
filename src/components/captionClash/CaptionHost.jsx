'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { advanceGame, nextRound } from '@/lib/roomApi'
import { useStepTimer } from '@/hooks/useStepTimer'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import { CountdownOverlay, LeaderboardPhase } from '@/components/PartyGameLayout'
import {
  AnsweredTracker,
  GameStage,
  PromptCard,
  RingTimer,
  PhaseReveal,
  getAccent,
} from '@/components/game/GameUI'

const ACCENT_KEY = 'captionClash'

export default function CaptionHost({ room, roomId, hostId, refresh }) {
  const [nextLoading, setNextLoading] = useState(false)
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const cc = room?.gameState?.captionClash
  const players = room?.players || []
  const accent = getAccent(ACCENT_KEY)

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
      <GameStage title="Caption Clash" emoji="💬" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
        <LeaderboardPhase
          room={room}
          onNextRound={handleNextRound}
          showNext={phase === 'leaderboard'}
          nextLoading={nextLoading}
        />
      </GameStage>
    )
  }

  const submissions = cc?.submissions || {}
  const votes = cc?.votes || {}

  return (
    <GameStage title="Caption Clash" emoji="💬" accentKey={ACCENT_KEY} room={room} round={round} maxRounds={5}>
      {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

      {phase === 'playing' && cc && (
        <PhaseReveal key={`${round}-${cc.step}`}>
          {cc.step === 'write' && (
            <div className="space-y-8">
              <PromptCard label="Write the funniest answer on your phone" accentKey={ACCENT_KEY}>
                <p className="font-display text-3xl font-extrabold leading-snug text-white sm:text-4xl">
                  {cc.promptText}
                </p>
              </PromptCard>
              <AnsweredTracker players={players} answeredIds={cc.answeredIds || []} accent={accent} label="submitted" />
              <div className="flex justify-center">
                <RingTimer endsAt={cc.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {cc.step === 'vote' && (
            <div className="space-y-6">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40">
                Vote for the funniest · {cc.promptText}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(submissions).map(([pid, text], i) => (
                  <motion.div
                    key={pid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/10 bg-cube-surface/70 p-5"
                  >
                    <span className="text-xs font-bold text-white/30">#{i + 1}</span>
                    <p className="mt-1 text-lg font-medium text-white">{text}</p>
                  </motion.div>
                ))}
              </div>
              <AnsweredTracker players={players} answeredIds={cc.answeredIds || []} accent={accent} label="voted" />
              <div className="flex justify-center">
                <RingTimer endsAt={cc.endsAt} accent={accent} />
              </div>
            </div>
          )}

          {cc.step === 'reveal' && (
            <div className="space-y-4">
              <p className="text-center text-sm font-bold uppercase tracking-widest text-white/40">
                Results · {cc.promptText}
              </p>
              {Object.entries(submissions)
                .map(([pid, text]) => ({
                  pid,
                  text,
                  author: players.find((p) => p.id === pid),
                  voteCount: Object.values(votes).filter((v) => v === pid).length,
                }))
                .sort((a, b) => b.voteCount - a.voteCount)
                .map(({ pid, text, author, voteCount }, i) => (
                  <motion.div
                    key={pid}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between gap-4 rounded-2xl border p-5"
                    style={{
                      borderColor: i === 0 ? `${accent.hex}66` : 'rgba(255,255,255,0.1)',
                      background: i === 0 ? `${accent.hex}12` : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div>
                      <p className="text-lg font-medium text-white">{text}</p>
                      <p className="mt-1 text-sm" style={{ color: author?.color }}>
                        {i === 0 ? '👑 ' : ''}{author?.name}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-xl font-black" style={{ color: accent.hex }}>
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  </motion.div>
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

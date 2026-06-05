'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { advanceGame, nextRound } from '@/lib/roomApi'
import { useStepTimer } from '@/hooks/useStepTimer'
import {
  AnimatePhase,
  CountdownOverlay,
  GameHeader,
  LeaderboardPhase,
  PhaseTimer,
} from '@/components/PartyGameLayout'

const CUBE_FACES = ['🎲', '🔥', '💋', '🍑', '🫦', '🌶️']

export default function TruthHost({ room, roomId, hostId, refresh }) {
  const [countdown, setCountdown] = useState(null)
  const [spinFace, setSpinFace] = useState(0)
  const phase = room?.phase
  const toc = room?.gameState?.truthOrCube
  const players = room?.players || []
  const target = players.find((p) => p.id === toc?.targetPlayerId)

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

  useEffect(() => {
    if (toc?.step !== 'cube') return undefined
    const id = setInterval(() => {
      setSpinFace((f) => (f + 1) % CUBE_FACES.length)
    }, 120)
    return () => clearInterval(id)
  }, [toc?.step])

  useStepTimer({
    enabled: phase === 'playing' && !!toc?.endsAt,
    endsAt: toc?.endsAt,
    roomId,
    hostId,
    onAdvanced: () => refresh(),
  })

  const handleNextRound = useCallback(async () => {
    await nextRound(roomId, hostId)
    refresh()
  }, [roomId, hostId, refresh])

  const handleForceAdvance = useCallback(async () => {
    await advanceGame(roomId, hostId)
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

  const typeLabel = toc?.cardType === 'dare' ? 'DARE' : 'TRUTH'

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader
        title="🎲 Truth or Cube"
        room={room}
        subtitle={`Round ${room?.gameState?.round ?? 1}`}
      />
      <div className="mx-auto max-w-3xl text-center">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

        {phase === 'playing' && toc && (
          <AnimatePhase phaseKey={toc.step}>
            <div className="rounded-2xl border border-cube-danger/30 bg-cube-surface/80 p-8">
              {toc.step === 'cube' && (
                <>
                  <p className="text-white/50">Spinning for {target?.name}…</p>
                  <motion.span
                    key={spinFace}
                    animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.35 }}
                    className="mt-6 inline-block text-8xl"
                  >
                    {CUBE_FACES[spinFace]}
                  </motion.span>
                  <PhaseTimer endsAt={toc.endsAt} label="Cube stops in" />
                </>
              )}

              {toc.step === 'active' && (
                <>
                  <p
                    className={`font-display text-5xl font-black ${
                      toc.cardType === 'dare' ? 'text-cube-danger' : 'text-cube-cyan'
                    }`}
                  >
                    {typeLabel}
                  </p>
                  <p className="mt-4 text-2xl text-white">
                    <span style={{ color: target?.color }}>{target?.name}</span> — check your phone!
                  </p>
                  {toc.outcome && (
                    <p className="mt-2 text-cube-violet">
                      {toc.outcome === 'done' ? '✓ Completed' : '🐔 Chickened out'}
                    </p>
                  )}
                  <PhaseTimer endsAt={toc.endsAt} label="Time left" />
                </>
              )}

              {toc.step === 'reveal' && (
                <>
                  <p className="text-sm uppercase text-white/40">{typeLabel}</p>
                  <p className="mt-2 font-display text-2xl text-white">{toc.promptText}</p>
                  <p className="mt-4 text-lg">
                    {target?.name}:{' '}
                    {toc.outcome === 'done' ? 'owned it' : toc.outcome === 'chicken' ? 'chickened out' : '…'}
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

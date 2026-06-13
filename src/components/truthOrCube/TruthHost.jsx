'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { advanceGame } from '@/lib/roomApi'
import { useLeaveGame } from '@/hooks/useLeaveGame'
import { useStepTimer } from '@/hooks/useStepTimer'
import { useGameCountdown } from '@/hooks/useGameCountdown'
import {
  AnimatePhase,
  CountdownOverlay,
  GameHeader,
  PhaseTimer,
} from '@/components/PartyGameLayout'
import TurnBoard from '@/components/truthOrCube/TurnBoard'

const CUBE_FACES = ['🎲', '🔥', '💋', '🍑', '🫦', '🌶️']

export default function TruthHost({ room, roomId, hostId, refresh }) {
  const [spinFace, setSpinFace] = useState(0)
  const leaveGame = useLeaveGame()
  const phase = room?.phase
  const round = room?.gameState?.round ?? 1
  const toc = room?.gameState?.truthOrCube
  const players = room?.players || []
  const target = players.find((p) => p.id === toc?.targetPlayerId)

  const countdown = useGameCountdown({
    phase,
    round,
    roomId,
    hostId,
    onDone: refresh,
  })

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

  const handleForceAdvance = useCallback(async () => {
    await advanceGame(roomId, hostId)
    refresh()
  }, [roomId, hostId, refresh])

  const typeLabel = toc?.cardType === 'dare' ? 'DARE' : 'TRUTH'
  const typeColor = toc?.cardType === 'dare' ? 'text-cube-danger' : 'text-cube-cyan'

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <GameHeader
        title="🎲 Truth or Dare"
        room={room}
        subtitle={target ? `${target.name}'s turn` : 'Going around the circle'}
      />

      <div className="mx-auto max-w-3xl text-center">
        {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

        {phase === 'playing' && toc && (
          <AnimatePhase phaseKey={`${round}-${toc.step}`}>
            <TurnBoard players={players} activeId={toc.targetPlayerId}>
              {toc.step === 'cube' && (
                <div>
                  <motion.span
                    key={spinFace}
                    animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.35 }}
                    className="inline-block text-7xl"
                  >
                    {CUBE_FACES[spinFace]}
                  </motion.span>
                  <p className="mt-3 text-sm text-white/50">
                    Spinning for {target?.name}…
                  </p>
                </div>
              )}

              {toc.step === 'active' && (
                <div>
                  <p className={`font-display text-5xl font-black ${typeColor}`}>
                    {typeLabel}
                  </p>
                  {toc.outcome && (
                    <p className="mt-2 text-sm text-cube-violet">
                      {toc.outcome === 'done' ? '✓ Completed' : '🐔 Chickened out'}
                    </p>
                  )}
                </div>
              )}

              {toc.step === 'reveal' && (
                <div>
                  <p className={`text-xs uppercase tracking-widest ${typeColor}`}>
                    {typeLabel}
                  </p>
                  <p className="mt-2 font-display text-xl leading-snug text-white">
                    {toc.promptText}
                  </p>
                </div>
              )}
            </TurnBoard>

            <div className="mt-6">
              {toc.step === 'active' && (
                <p className="text-xl text-white">
                  <span style={{ color: target?.color }}>{target?.name}</span> — check
                  your phone!
                </p>
              )}
              {toc.step === 'reveal' && toc.cardType === 'truth' && (
                <p className="mx-auto max-w-2xl text-2xl font-bold leading-relaxed text-white">
                  {toc.answerText ? `“${toc.answerText}”` : 'No answer.'}
                </p>
              )}
              {toc.step === 'reveal' && toc.cardType !== 'truth' && (
                <p className="text-lg text-white/80">
                  {target?.name}:{' '}
                  {toc.outcome === 'done'
                    ? 'owned it 🔥'
                    : toc.outcome === 'chicken'
                      ? 'chickened out 🐔'
                      : '…'}
                </p>
              )}

              {toc.step !== 'reveal' && (
                <PhaseTimer
                  endsAt={toc.endsAt}
                  label={toc.step === 'cube' ? 'Cube stops in' : 'Time left'}
                />
              )}

              <div className="mt-6 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={handleForceAdvance}
                  className="text-sm text-white/30 hover:text-white/60"
                >
                  Host: skip →
                </button>
                <button
                  type="button"
                  onClick={leaveGame}
                  className="rounded-full border border-cube-danger/40 bg-cube-danger/10 px-4 py-2 text-sm font-semibold text-cube-danger hover:bg-cube-danger/20"
                >
                  End game
                </button>
              </div>
            </div>
          </AnimatePhase>
        )}
      </div>
    </main>
  )
}

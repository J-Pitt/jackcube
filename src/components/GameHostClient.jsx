'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import FlappyHostCanvas from '@/components/flappy/FlappyHostCanvas'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import {
  endRound,
  nextRound,
  syncGameState,
} from '@/lib/roomApi'
import {
  applyFlaps,
  allBirdsDead,
  FLAPPY,
  roundScoresFromBirds,
  stepFlappy,
} from '@/lib/flappyEngine'
import { loadRejoin } from '@/lib/rejoin'

const Leaderboard3D = dynamic(() => import('@/components/leaderboard/Leaderboard3D'), {
  ssr: false,
  loading: () => <p className="text-white/50">Loading leaderboard…</p>,
})

export default function GameHostClient({ roomId: roomIdProp }) {
  const session = loadRejoin()
  const roomId = roomIdProp || session?.roomId
  const hostId = session?.playerId

  const { room, refresh } = useRoomPoll(roomId, 400)
  const [localFlappy, setLocalFlappy] = useState(null)
  const [countdown, setCountdown] = useState(null)

  const simRef = useRef(null)
  const lastSyncRef = useRef(0)
  const processedFlapsRef = useRef(0)
  const rafRef = useRef(null)
  const endsAtRef = useRef(null)

  const isHost = session?.playerId === room?.hostId
  const phase = room?.phase
  const players = room?.players || []

  // Initialize local sim from room state
  useEffect(() => {
    if (room?.gameState?.flappy && !simRef.current) {
      simRef.current = structuredClone(room.gameState.flappy)
      setLocalFlappy(simRef.current)
    }
    if (room?.gameState?.flappy && phase === 'playing') {
      if (!simRef.current) {
        simRef.current = structuredClone(room.gameState.flappy)
      }
      if (room.gameState.flappy.endsAt) {
        endsAtRef.current = new Date(room.gameState.flappy.endsAt).getTime()
      }
    }
  }, [room?.gameState?.flappy, phase])

  // Countdown 3-2-1 then start playing
  useEffect(() => {
    if (phase !== 'countdown' || !isHost || !room?.gameState?.flappy) return undefined

    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          return null
        }
        return c - 1
      })
    }, 1000)

    const timeout = setTimeout(async () => {
      if (!simRef.current) simRef.current = structuredClone(room.gameState.flappy)
      const now = new Date()
      const ends = new Date(now.getTime() + FLAPPY.ROUND_SEC * 1000)
      simRef.current.startedAt = now.toISOString()
      simRef.current.endsAt = ends.toISOString()
      endsAtRef.current = ends.getTime()
      setLocalFlappy({ ...simRef.current })

      await syncGameState(roomId, hostId, {
        phase: 'playing',
        gameState: { ...room.gameState, flappy: simRef.current },
      })
      refresh()
    }, 3200)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [phase, isHost, room, roomId, hostId, refresh])

  const roomGameStateRef = useRef(null)
  roomGameStateRef.current = room?.gameState

  // Apply flaps from server queue
  useEffect(() => {
    if (phase !== 'playing' || !simRef.current || !room?.gameState?.flappy) return

    const queue = room.gameState.flappy.flapQueue || []
    if (queue.length === 0) {
      processedFlapsRef.current = 0
      return
    }
    if (queue.length <= processedFlapsRef.current) return

    const newFlaps = queue.slice(processedFlapsRef.current).map((f) => f.playerId)
    processedFlapsRef.current = queue.length
    applyFlaps(simRef.current, newFlaps)
  }, [room?.gameState?.flappy?.flapQueue, phase, room?.gameState?.flappy])

  // Game loop
  useEffect(() => {
    if (phase !== 'playing' || !isHost) return undefined

    let ended = false

    const tick = () => {
      if (!simRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      simRef.current = stepFlappy(simRef.current, 1)
      setLocalFlappy({ ...simRef.current })

      const now = Date.now()
      const timeUp = endsAtRef.current && now >= endsAtRef.current
      const allDead = allBirdsDead(simRef.current)

      if ((timeUp || allDead) && !ended) {
        ended = true
        const scores = roundScoresFromBirds(simRef.current)
        endRound(roomId, hostId, scores)
          .then(() => refresh())
          .catch(() => {})
      } else if (!ended && now - lastSyncRef.current > 180) {
        lastSyncRef.current = now
        const flappyCopy = { ...simRef.current, flapQueue: [] }
        syncGameState(roomId, hostId, {
          phase: 'playing',
          gameState: { ...roomGameStateRef.current, flappy: flappyCopy },
        }).catch(() => {})
      }

      if (!ended) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, isHost, roomId, hostId, refresh])

  // Reset sim on new round
  useEffect(() => {
    if (phase === 'countdown' && room?.gameState?.flappy) {
      simRef.current = structuredClone(room.gameState.flappy)
      processedFlapsRef.current = 0
      setLocalFlappy(simRef.current)
      endsAtRef.current = null
    }
  }, [phase, room?.gameState?.round])

  const handleNextRound = useCallback(async () => {
    await nextRound(roomId, hostId)
    simRef.current = null
    processedFlapsRef.current = 0
    refresh()
  }, [roomId, hostId, refresh])

  if (!roomId) {
    return <p className="p-8 text-white/60">No room session.</p>
  }

  if (!isHost) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p className="text-white/60">
          This is the host screen. Open <strong>/play</strong> on your phone to control your bird.
        </p>
      </main>
    )
  }

  const winner = players.find((p) => p.id === room?.gameState?.winnerId)
  const displayFlappy = localFlappy || room?.gameState?.flappy

  return (
    <main className="min-h-screen bg-cube-bg px-4 py-6">
      <header className="mx-auto mb-4 flex max-w-5xl items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cube-violet">JackCube</p>
          <h1 className="font-display text-2xl font-bold text-white">
            {phase === 'playing' ? '🐦 Cube Flap' : phase === 'leaderboard' ? '🏆 Round results' : phase === 'victory' ? '🎉 Winner!' : 'Get ready'}
          </h1>
          {room?.gameState?.round && (
            <p className="text-sm text-white/40">Round {room.gameState.round}</p>
          )}
        </div>
        <div className="text-right text-sm text-white/50">
          Code: <span className="font-bold text-cube-cyan">{room?.gameCode}</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl">
        <AnimatePresence mode="wait">
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-64 items-center justify-center"
            >
              <span className="font-display text-8xl font-black text-cube-cyan">
                {countdown ?? 'GO!'}
              </span>
            </motion.div>
          )}

          {(phase === 'playing' || (phase === 'countdown' && displayFlappy)) && phase !== 'leaderboard' && (
            <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {displayFlappy && (
                <FlappyHostCanvas flappy={displayFlappy} players={players} />
              )}
              {phase === 'playing' && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {players.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full px-3 py-1 text-sm font-medium"
                      style={{ backgroundColor: `${p.color}33`, color: p.color }}
                    >
                      {p.name}: {displayFlappy?.birds?.[p.id]?.score ?? 0}
                      {!displayFlappy?.birds?.[p.id]?.alive && ' 💀'}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {phase === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Leaderboard3D
                results={room?.gameState?.roundResults}
                players={players}
                targetScore={room?.config?.targetScore}
              />
              <button
                type="button"
                onClick={handleNextRound}
                className="mt-6 w-full rounded-xl bg-cube-violet py-3 font-bold text-white hover:bg-cube-violet/90"
              >
                Next round →
              </button>
            </motion.div>
          )}

          {phase === 'victory' && (
            <motion.div
              key="victory"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <Leaderboard3D
                results={room?.gameState?.roundResults}
                players={players}
                targetScore={room?.config?.targetScore}
              />
              <p className="mt-6 font-display text-4xl font-bold text-cube-cyan">
                {winner?.name} wins!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

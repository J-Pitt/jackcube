'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import LobbyVideo from '@/components/LobbyVideo'
import HostVideoRail from '@/components/partyVideo/HostVideoRail'
import PlayerList from '@/components/PlayerList'
import RoomCodeDisplay from '@/components/RoomCodeDisplay'
import MatureGate, { hasMatureConsent } from '@/components/MatureGate'
import { useRoomPoll } from '@/hooks/useRoomPoll'
import { leaveRoom, startGame, updateRoomConfig } from '@/lib/roomApi'
import { clearRejoin, getRejoinPath, loadRejoin, saveRejoin } from '@/lib/rejoin'
import Link from 'next/link'
import {
  FAMILY_GAMES,
  getGameMeta,
  isAdultGame,
  validatePlayerCount,
} from '@/lib/games/registry'
import { isAdultUnlocked } from '@/lib/adultAccess'

function dedupePlayersById(players) {
  const seen = new Set()
  return players.filter((p) => {
    if (!p?.id || seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

export default function LobbyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomIdParam = searchParams.get('roomId')

  const [session, setSession] = useState(null)
  const [startLoading, setStartLoading] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [selectedGame, setSelectedGame] = useState('flappy')
  const [spicyRemote, setSpicyRemote] = useState(false)

  useEffect(() => {
    const saved = loadRejoin()
    if (saved?.roomId) {
      setSession(saved)
    } else if (roomIdParam) {
      setSession({ roomId: roomIdParam })
    }
  }, [roomIdParam])

  const roomId = session?.roomId
  const { room, error: pollError, loading, refresh } = useRoomPoll(roomId)

  useEffect(() => {
    if (room?.config?.gameId) {
      setSelectedGame(room.config.gameId)
    }
    if (room?.config?.spicyRemote) {
      setSpicyRemote(room.config.spicyRemote)
    }
  }, [room?.config?.gameId, room?.config?.spicyRemote])

  useEffect(() => {
    if (!room || !session || session.playerId) return
    if (session.isHost && room.hostId) {
      setSession((s) => ({ ...s, playerId: room.hostId }))
      return
    }
    if (session.playerName && room.players?.length) {
      const key = session.playerName.trim().toLowerCase()
      const byName = room.players.find((p) => p.name?.trim().toLowerCase() === key)
      if (byName) {
        setSession((s) => ({
          ...s,
          playerId: byName.id,
          isHost: byName.id === room.hostId,
        }))
      }
    }
  }, [room, session])

  useEffect(() => {
    if (room?.phase && room.phase !== 'lobby') {
      const saved = loadRejoin()
      router.push(getRejoinPath(saved, room.phase))
    }
  }, [room?.phase, room?.hostId, roomId, router])

  const handleLeave = useCallback(async () => {
    if (session?.roomId && session?.playerId) {
      await leaveRoom(session.roomId, session.playerId).catch(() => {})
    }
    clearRejoin()
    router.push('/')
  }, [session, router])

  async function handleGameChange(gameId) {
    setSelectedGame(gameId)
    if (!room || session?.playerId !== room.hostId) return
    try {
      await updateRoomConfig(room.roomId, room.hostId, { gameId })
      refresh()
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleSpicyRemote(checked) {
    setSpicyRemote(checked)
    if (!room || session?.playerId !== room.hostId) return
    try {
      await updateRoomConfig(room.roomId, room.hostId, { spicyRemote: checked })
      refresh()
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleStart() {
    if (!room || !session?.playerId) return
    const meta = getGameMeta(selectedGame)
    if (meta.mature && !hasMatureConsent()) {
      setActionError('Confirm 18+ on the play screen after starting, or open /play once to accept.')
    }
    const validation = validatePlayerCount(selectedGame, (room.players || []).length)
    if (!validation.ok) {
      setActionError(validation.error)
      return
    }
    setActionError(null)
    setStartLoading(true)
    try {
      await startGame(room.roomId, room.hostId)
    } catch (err) {
      setActionError(err.message || 'Could not start game')
    } finally {
      setStartLoading(false)
    }
  }

  if (!session?.roomId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center p-6 text-center">
        <p className="text-white/70">No active room session.</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 text-cube-cyan hover:underline"
        >
          Back home
        </button>
      </main>
    )
  }

  const isHost =
    session?.isHost === true || session?.playerId === room?.hostId
  const myPlayer = room?.players?.find((p) => p.id === session?.playerId)
  const playerNames = dedupePlayersById(room?.players || [])
  const connectedCount = playerNames.filter((p) => !p.disconnectedAt).length
  const meta = getGameMeta(selectedGame)
  const countOk = validatePlayerCount(selectedGame, connectedCount).ok

  return (
    <MatureGate required={meta.mature}>
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-widest text-cube-violet">JackCube</p>
            <h1 className="font-display text-3xl font-bold text-white">Party lobby</h1>
            <p className="mt-1 text-sm text-white/50">
              {room?.mode === 'local' ? '🏠 Local party' : '🌐 Online party'}
              {' · '}
              First to {room?.config?.targetScore?.toLocaleString() ?? '5,000'} pts wins
            </p>
          </div>
          <button
            type="button"
            onClick={handleLeave}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            Leave room
          </button>
        </header>

        {(pollError || actionError) && (
          <div className="mb-6 rounded-xl border border-cube-danger/40 bg-cube-danger/10 px-4 py-3 text-sm text-cube-danger">
            {pollError || actionError}
          </div>
        )}

        {loading && !room ? (
          <p className="text-white/60">Loading room…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-cube-surface/60 p-6"
            >
              <h2 className="mb-4 text-lg font-semibold text-white">Invite players</h2>
              {room?.gameCode && (
                <RoomCodeDisplay gameCode={room.gameCode} mode={room.mode} />
              )}

              {isHost && (
                <div className="mt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
                    Choose game
                  </h3>
                  {isAdultGame(selectedGame) ? (
                    <div className="rounded-xl border border-cube-danger/30 bg-cube-danger/5 px-4 py-3">
                      <p className="font-semibold text-white">
                        {meta.name}
                        <span className="ml-2 text-xs text-cube-danger">18+</span>
                      </p>
                      <p className="mt-1 text-xs text-white/50">{meta.description}</p>
                      {isAdultUnlocked() && (
                        <Link
                          href="/adult-games"
                          className="mt-2 inline-block text-xs text-cube-cyan hover:underline"
                        >
                          Change adult game →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {FAMILY_GAMES.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleGameChange(g.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                            selectedGame === g.id
                              ? 'border-cube-cyan bg-cube-cyan/10'
                              : 'border-white/10 hover:border-white/25'
                          }`}
                        >
                          <span className="font-semibold text-white">{g.name}</span>
                          <p className="mt-1 text-xs text-white/50">{g.description}</p>
                          <p className="mt-1 text-xs text-white/30">
                            {g.minPlayers}–{g.maxPlayers} players
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  {room?.mode === 'online' && meta.mature && selectedGame === 'fakinIt' && (
                    <label className="mt-4 flex items-center gap-2 text-sm text-white/60">
                      <input
                        type="checkbox"
                        checked={spicyRemote}
                        onChange={(e) => handleSpicyRemote(e.target.checked)}
                      />
                      Allow non-remote-safe prompts in online mode
                    </label>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/50">
                  Players ({playerNames.length}/8)
                </h3>
                <PlayerList
                  players={playerNames}
                  hostId={room?.hostId}
                  myPlayerId={session?.playerId}
                />
              </div>

              {isHost && (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={startLoading || !countOk}
                  className="mt-6 w-full rounded-xl bg-cube-cyan py-3 font-bold text-cube-bg transition hover:bg-cube-cyan/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {startLoading
                    ? 'Starting…'
                    : !countOk
                      ? `Need ${meta.minPlayers}+ players for ${meta.name}`
                      : `Start ${meta.name}`}
                </button>
              )}

              {!isHost && (
                <p className="mt-6 text-center text-sm text-white/50">
                  Waiting for host to start {getGameMeta(room?.config?.gameId || 'flappy').name}…
                </p>
              )}
            </motion.section>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              {isHost && session?.screenRole === 'tv' ? <HostVideoRail /> : <LobbyVideo />}
            </motion.div>
          </div>
        )}
      </main>
    </MatureGate>
  )
}

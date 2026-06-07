'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Suspense, useEffect, useState } from 'react'
import AdultGamesPasswordModal from '@/components/AdultGamesPasswordModal'
import ModeSelectModal from '@/components/ModeSelectModal'
import { getMultiplayerStatus, getRoom } from '@/lib/roomApi'
import { getRejoinPath, loadRejoin } from '@/lib/rejoin'
import { isAdultUnlocked } from '@/lib/adultAccess'

function HomeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [redisOk, setRedisOk] = useState(null)
  const [saved, setSaved] = useState(null)
  const [rejoinHref, setRejoinHref] = useState(null)
  const [adultModalOpen, setAdultModalOpen] = useState(false)
  // Which catalog the mode modal will route to: 'party' | 'duo' | 'adult' | null
  const [modeFor, setModeFor] = useState(null)

  useEffect(() => {
    getMultiplayerStatus().then((s) => setRedisOk(s.available))
    const rejoin = loadRejoin()
    setSaved(rejoin)
    if (rejoin?.roomId) {
      getRoom(rejoin.roomId)
        .then((room) => setRejoinHref(getRejoinPath(rejoin, room.phase)))
        .catch(() => setRejoinHref(getRejoinPath(rejoin, 'lobby')))
    }
    if (searchParams.get('adult') === 'locked') {
      setAdultModalOpen(true)
    }
  }, [searchParams])

  function chooseParty() {
    setModeFor('party')
  }

  function chooseDuo() {
    setModeFor('duo')
  }

  function chooseAdult() {
    if (isAdultUnlocked()) {
      setModeFor('adult')
      return
    }
    setAdultModalOpen(true)
  }

  function handleModeSelect(mode) {
    const target =
      modeFor === 'adult' ? '/adult-games' : modeFor === 'duo' ? '/duo-games' : '/games'
    setModeFor(null)
    router.push(`${target}?mode=${mode}`)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-10"
      >
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-cube-violet to-cube-cyan shadow-lg shadow-cube-violet/30">
          <span className="text-4xl">🎲</span>
        </div>
        <h1 className="font-display text-5xl font-extrabold tracking-tight text-white">
          Party Cube
        </h1>
        <p className="mt-3 text-lg text-white/60">
          Party games on the big screen. Phones as controllers.
        </p>
      </motion.div>

      {redisOk === false && (
        <div className="mb-6 w-full max-w-md rounded-xl border border-cube-danger/40 bg-cube-danger/10 px-4 py-3 text-sm text-cube-danger">
          Multiplayer unavailable — set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
        </div>
      )}

      {saved?.roomId && rejoinHref && (
        <Link
          href={rejoinHref}
          className="mb-8 w-full max-w-md rounded-2xl border border-cube-cyan/40 bg-cube-cyan/10 px-6 py-4 text-cube-cyan transition hover:bg-cube-cyan/15"
        >
          Rejoin room <strong>{saved.gameCode}</strong> as {saved.playerName}
        </Link>
      )}

      <p className="mb-4 text-sm uppercase tracking-widest text-white/40">Choose your vibe</p>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={chooseParty}
          className="group rounded-3xl border border-cube-cyan/30 bg-cube-cyan/5 p-7 text-left transition hover:border-cube-cyan/60 hover:bg-cube-cyan/10 active:scale-[0.98]"
        >
          <span className="text-4xl">🎮</span>
          <h2 className="mt-4 font-display text-2xl font-bold text-white group-hover:text-cube-cyan">
            Party games
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Caption Clash, Trivia, Doodle Dash &amp; more · 2–5 players
          </p>
        </button>

        <button
          type="button"
          onClick={chooseDuo}
          className="group rounded-3xl border border-[#FFD166]/35 bg-[#FFD166]/5 p-7 text-left transition hover:border-[#FFD166]/60 hover:bg-[#FFD166]/10 active:scale-[0.98]"
        >
          <span className="text-4xl">⚔️</span>
          <h2 className="mt-4 font-display text-2xl font-bold text-white group-hover:text-[#FFD166]">
            Duo games
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Head-to-head · exactly 2 players
          </p>
        </button>

        <button
          type="button"
          onClick={chooseAdult}
          className="group rounded-3xl border border-cube-danger/40 bg-cube-danger/10 p-7 text-left transition hover:border-cube-danger/70 hover:bg-cube-danger/15 active:scale-[0.98]"
        >
          <span className="text-4xl">🔞</span>
          <h2 className="mt-4 font-display text-2xl font-bold text-white">
            Adult games
          </h2>
          <p className="mt-2 text-sm text-white/50">Password required · 18+ party games</p>
        </button>
      </div>

      <Link
        href="/join"
        className="mt-8 text-sm text-white/50 underline-offset-4 hover:text-cube-cyan hover:underline"
      >
        Join with a room code →
      </Link>

      <ModeSelectModal
        open={modeFor !== null}
        accent={modeFor === 'adult' ? '#E5383B' : modeFor === 'duo' ? '#FFD166' : '#00F5D4'}
        onClose={() => setModeFor(null)}
        onSelect={handleModeSelect}
      />

      <AdultGamesPasswordModal
        open={adultModalOpen}
        onClose={() => setAdultModalOpen(false)}
        onUnlocked={() => setModeFor('adult')}
      />
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-white/50">Loading…</main>}>
      <HomeContent />
    </Suspense>
  )
}

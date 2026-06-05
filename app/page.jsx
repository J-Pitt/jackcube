'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Suspense, useEffect, useState } from 'react'
import AdultGamesPasswordModal from '@/components/AdultGamesPasswordModal'
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

  function openAdultGames() {
    if (isAdultUnlocked()) {
      router.push('/adult-games')
      return
    }
    setAdultModalOpen(true)
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
          JackCube
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

      <p className="mb-4 text-sm uppercase tracking-widest text-white/40">How are you playing?</p>

      <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
        <Link
          href="/host?mode=local"
          className="group rounded-2xl border border-white/10 bg-cube-surface/80 p-6 text-left transition hover:border-cube-cyan/50 hover:bg-cube-surface"
        >
          <span className="text-3xl">🏠</span>
          <h2 className="mt-3 font-display text-xl font-bold text-white group-hover:text-cube-cyan">
            Local party
          </h2>
          <p className="mt-2 text-sm text-white/50">Same room — TV + phones on WiFi</p>
        </Link>

        <Link
          href="/host?mode=online"
          className="group rounded-2xl border border-white/10 bg-cube-surface/80 p-6 text-left transition hover:border-cube-violet/50 hover:bg-cube-surface"
        >
          <span className="text-3xl">🌐</span>
          <h2 className="mt-3 font-display text-xl font-bold text-white group-hover:text-cube-violet">
            Online party
          </h2>
          <p className="mt-2 text-sm text-white/50">Friends anywhere — share a link</p>
        </Link>
      </div>

      <button
        type="button"
        onClick={openAdultGames}
        className="mt-8 w-full max-w-md rounded-2xl border border-cube-danger/40 bg-cube-danger/10 px-6 py-4 text-left transition hover:bg-cube-danger/15"
      >
        <span className="text-2xl">🔞</span>
        <span className="mt-2 block font-display text-lg font-bold text-white">Adult games</span>
        <span className="text-sm text-white/50">Password required · 18+ party games</span>
      </button>

      <Link
        href="/join"
        className="mt-6 text-sm text-white/50 underline-offset-4 hover:text-cube-cyan hover:underline"
      >
        Join with a room code →
      </Link>

      <AdultGamesPasswordModal
        open={adultModalOpen}
        onClose={() => setAdultModalOpen(false)}
        onUnlocked={() => router.push('/adult-games')}
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

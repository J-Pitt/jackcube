'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ADULT_GAMES } from '@/lib/games/registry'
import { isAdultUnlocked } from '@/lib/adultAccess'
import MatureGate from '@/components/MatureGate'

export default function AdultGamesPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isAdultUnlocked()) {
      router.replace('/?adult=locked')
      return
    }
    setReady(true)
  }, [router])

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/50">
        Checking access…
      </main>
    )
  }

  return (
    <MatureGate required>
      <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
        <Link href="/" className="text-sm text-white/40 hover:text-cube-cyan">
          ← Back home
        </Link>
        <h1 className="mt-6 font-display text-4xl font-bold text-white">Adult games</h1>
        <p className="mt-2 text-white/50">Pick a game, then host a local or online party.</p>

        <div className="mt-10 space-y-4">
          {ADULT_GAMES.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-cube-danger/20 bg-cube-surface/80 p-5"
            >
              <h2 className="font-display text-xl font-bold text-white">
                {g.name}
                <span className="ml-2 text-xs font-normal text-cube-danger">18+</span>
              </h2>
              <p className="mt-1 text-sm text-white/50">{g.description}</p>
              <p className="mt-1 text-xs text-white/30">
                {g.minPlayers}–{g.maxPlayers} players
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <Link
                  href={`/host?mode=local&gameId=${g.id}&adult=1`}
                  className="rounded-xl border border-white/10 py-2.5 text-center text-sm font-semibold text-white hover:border-cube-cyan/50"
                >
                  Host local
                </Link>
                <Link
                  href={`/host?mode=online&gameId=${g.id}&adult=1`}
                  className="rounded-xl border border-white/10 py-2.5 text-center text-sm font-semibold text-white hover:border-cube-violet/50"
                >
                  Host online
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </MatureGate>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { PARTY_GAMES } from '@/lib/games/registry'

export default function GamesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-white/40 hover:text-cube-cyan">
        ← Back home
      </Link>
      <h1 className="mt-6 font-display text-4xl font-bold text-white">Party games</h1>
      <p className="mt-2 text-white/50">
        Jackbox &amp; Mario Party vibes — 2–5 players, phones as controllers.
      </p>

      <div className="mt-10 space-y-4">
        {PARTY_GAMES.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/10 bg-cube-surface/80 p-5"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{g.emoji}</span>
              <div className="flex-1">
                <h2 className="font-display text-xl font-bold text-white">{g.name}</h2>
                <p className="mt-1 text-sm text-white/50">{g.description}</p>
                <p className="mt-2 text-xs text-white/30">
                  {g.minPlayers}–{g.maxPlayers} players · {g.maxRounds} rounds
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/host?mode=local&gameId=${g.id}`}
                    className="rounded-lg bg-cube-cyan px-4 py-2 text-sm font-bold text-cube-bg hover:bg-cube-cyan/90"
                  >
                    Host local
                  </Link>
                  <Link
                    href={`/host?mode=online&gameId=${g.id}`}
                    className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-cube-cyan/50"
                  >
                    Host online
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  )
}

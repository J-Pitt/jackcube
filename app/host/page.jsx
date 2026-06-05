'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createRoom } from '@/lib/roomApi'
import { saveRejoin } from '@/lib/rejoin'

function HostForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'local' ? 'local' : 'online'
  const gameIdParam = searchParams.get('gameId')
  const validGameIds = ['flappy', 'truthOrCube', 'fakinIt', 'dirtyDrawful', 'letMeFinish']
  const gameId = validGameIds.includes(gameIdParam) ? gameIdParam : 'flappy'
  const isAdult = searchParams.get('adult') === '1' || gameId !== 'flappy'

  const [name, setName] = useState('')
  const [targetScore, setTargetScore] = useState(5000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await createRoom({
        hostName: name.trim() || 'Host',
        mode,
        targetScore,
        gameId: isAdult ? gameId : 'flappy',
      })
      saveRejoin({
        roomId: data.roomId,
        gameCode: data.gameCode,
        playerName: name.trim() || 'Host',
        isHost: true,
        mode: data.mode,
        screenRole: 'tv',
      })
      router.push(`/lobby?roomId=${encodeURIComponent(data.roomId)}`)
    } catch (err) {
      setError(err.message || 'Could not create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <p className="text-sm uppercase tracking-widest text-cube-violet">Host a party</p>
      <h1 className="font-display text-3xl font-bold text-white">
        {mode === 'local' ? 'Local party' : 'Online party'}
      </h1>
      <p className="mt-2 text-sm text-white/50">
        {mode === 'local'
          ? 'Open this on the TV or shared screen. Friends scan the QR on the same WiFi.'
          : 'Share the invite link with friends anywhere. Stream this window in Zoom or Discord.'}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block">
          <span className="text-sm text-white/60">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Host"
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/30"
          />
        </label>

        <label className="block">
          <span className="text-sm text-white/60">Points to win</span>
          <select
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white"
          >
            <option value={3000}>3,000</option>
            <option value={5000}>5,000</option>
            <option value={10000}>10,000</option>
          </select>
        </label>

        {error && (
          <p className="text-sm text-cube-danger" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-cube-violet py-3 font-bold text-white hover:bg-cube-violet/90 disabled:opacity-50"
        >
          {loading ? 'Creating room…' : 'Create room'}
        </button>
      </form>
    </main>
  )
}

export default function HostPage() {
  return (
    <Suspense fallback={<p className="p-8 text-white/60">Loading…</p>}>
      <HostForm />
    </Suspense>
  )
}

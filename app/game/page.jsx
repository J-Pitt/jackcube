'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import GameHostClient from '@/components/GameHostClient'
import { loadRejoin } from '@/lib/rejoin'

function GameHostPageInner() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get('roomId') || loadRejoin()?.roomId
  return <GameHostClient roomId={roomId} />
}

export default function GamePage() {
  return (
    <Suspense fallback={<p className="p-8 text-white/60">Loading game…</p>}>
      <GameHostPageInner />
    </Suspense>
  )
}

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import GamePlayClient from '@/components/GamePlayClient'
import { loadRejoin } from '@/lib/rejoin'

function PlayPageInner() {
  const searchParams = useSearchParams()
  const roomId = searchParams.get('roomId') || loadRejoin()?.roomId
  return <GamePlayClient roomId={roomId} />
}

export default function PlayPage() {
  return (
    <Suspense fallback={<p className="p-8 text-white/60">Loading…</p>}>
      <PlayPageInner />
    </Suspense>
  )
}

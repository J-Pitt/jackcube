'use client'

import { Suspense } from 'react'
import LobbyClient from '@/components/LobbyClient'

export default function LobbyPage() {
  return (
    <Suspense fallback={<p className="p-8 text-white/60">Loading lobby…</p>}>
      <LobbyClient />
    </Suspense>
  )
}

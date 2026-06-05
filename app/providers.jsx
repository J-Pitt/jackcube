'use client'

import { PartyVideoProvider } from '@/contexts/PartyVideoContext'

export default function Providers({ children }) {
  return <PartyVideoProvider>{children}</PartyVideoProvider>
}

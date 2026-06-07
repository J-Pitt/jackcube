'use client'

import CaptionHost from '@/components/captionClash/CaptionHost'

export default function CaptionDuelHost(props) {
  return (
    <CaptionHost
      {...props}
      slotKey="captionDuel"
      accentKey="captionDuel"
      title="Caption Duel"
      emoji="💥"
      writeLabel="Write your best caption on your phone"
    />
  )
}

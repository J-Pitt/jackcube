'use client'

import CaptionPlay from '@/components/captionClash/CaptionPlay'

export default function CaptionDuelPlay(props) {
  return (
    <CaptionPlay
      {...props}
      slotKey="captionDuel"
      accentKey="captionDuel"
      title="Caption Duel"
      emoji="💥"
    />
  )
}

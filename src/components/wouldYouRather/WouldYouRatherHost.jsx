'use client'

import VoteHost from '@/components/voteGame/VoteHost'

const CONFIG = { slotKey: 'wouldYouRather', accentKey: 'wouldYouRather', title: 'Would You Rather', emoji: '🔀', type: 'ab' }

export default function WouldYouRatherHost(props) {
  return <VoteHost {...props} config={CONFIG} />
}

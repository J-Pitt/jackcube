'use client'

import VotePlay from '@/components/voteGame/VotePlay'

const CONFIG = { slotKey: 'wouldYouRather', accentKey: 'wouldYouRather', title: 'Would You Rather', emoji: '🔀', type: 'ab' }

export default function WouldYouRatherPlay(props) {
  return <VotePlay {...props} config={CONFIG} />
}

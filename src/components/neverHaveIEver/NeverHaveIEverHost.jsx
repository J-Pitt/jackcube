'use client'

import VoteHost from '@/components/voteGame/VoteHost'

const CONFIG = { slotKey: 'neverHaveIEver', accentKey: 'neverHaveIEver', title: 'Never Have I Ever', emoji: '🙈', type: 'haveNever' }

export default function NeverHaveIEverHost(props) {
  return <VoteHost {...props} config={CONFIG} />
}

'use client'

import VotePlay from '@/components/voteGame/VotePlay'

const CONFIG = { slotKey: 'neverHaveIEver', accentKey: 'neverHaveIEver', title: 'Never Have I Ever', emoji: '🙈', type: 'haveNever' }

export default function NeverHaveIEverPlay(props) {
  return <VotePlay {...props} config={CONFIG} />
}

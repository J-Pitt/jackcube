'use client'

import DoodlePlay from '@/components/doodle/DoodlePlay'

export default function DoodleDuelPlay(props) {
  return (
    <DoodlePlay
      {...props}
      slotKey="doodleDuel"
      accentKey="doodleDuel"
      title="Doodle Duel"
      emoji="🖊️"
    />
  )
}

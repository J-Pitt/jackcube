'use client'

import DoodleHost from '@/components/doodle/DoodleHost'

export default function DoodleDuelHost(props) {
  return (
    <DoodleHost
      {...props}
      slotKey="doodleDuel"
      accentKey="doodleDuel"
      title="Doodle Duel"
      emoji="🖊️"
    />
  )
}

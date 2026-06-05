import behaviorDeck from '@/content/decks/fakinIt/behavior.json'
import remoteDeck from '@/content/decks/fakinIt/remote.json'
import drawingDeck from '@/content/decks/dirtyDrawful/drawing.json'
import hostLinesDeck from '@/content/decks/dirtyDrawful/hostLines.json'
import questionsDeck from '@/content/decks/letMeFinish/questions.json'
import challengerDeck from '@/content/decks/letMeFinish/challengerPrompts.json'

const DECKS = {
  'fakinIt/behavior': behaviorDeck,
  'fakinIt/remote': remoteDeck,
  'dirtyDrawful/drawing': drawingDeck,
  'dirtyDrawful/hostLines': hostLinesDeck,
  'letMeFinish/questions': questionsDeck,
  'letMeFinish/challengerPrompts': challengerDeck,
}

export function getDeck(key) {
  return DECKS[key]
}

export function pickRandomItem(deckKey, { excludeIds = [], remoteOnly = false } = {}) {
  const deck = DECKS[deckKey]
  if (!deck?.items?.length) return null
  let pool = deck.items.filter((item) => !excludeIds.includes(item.id))
  if (remoteOnly) pool = pool.filter((item) => item.remotePlaySafe === true)
  if (pool.length === 0) pool = deck.items.filter((item) => !excludeIds.includes(item.id))
  if (pool.length === 0) pool = deck.items
  return pool[Math.floor(Math.random() * pool.length)]
}

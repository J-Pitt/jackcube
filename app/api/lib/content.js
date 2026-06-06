const behaviorDeck = require('../../../src/content/decks/fakinIt/behavior.json')
const remoteDeck = require('../../../src/content/decks/fakinIt/remote.json')
const drawingDeck = require('../../../src/content/decks/dirtyDrawful/drawing.json')
const hostLinesDeck = require('../../../src/content/decks/dirtyDrawful/hostLines.json')
const questionsDeck = require('../../../src/content/decks/letMeFinish/questions.json')
const challengerDeck = require('../../../src/content/decks/letMeFinish/challengerPrompts.json')
const tocTruthsDeck = require('../../../src/content/decks/truthOrCube/truths.json')
const tocDaresDeck = require('../../../src/content/decks/truthOrCube/dares.json')
const captionClashDeck = require('../../../src/content/decks/captionClash/prompts.json')
const bluffBoxDeck = require('../../../src/content/decks/bluffBox/prompts.json')
const triviaTossDeck = require('../../../src/content/decks/triviaToss/questions.json')
const categoriesDeck = require('../../../src/content/decks/categories/prompts.json')
const doodleDeck = require('../../../src/content/decks/doodle/words.json')
const wordBluffDeck = require('../../../src/content/decks/wordBluff/words.json')
const wouldYouRatherDeck = require('../../../src/content/decks/wouldYouRather/prompts.json')
const neverHaveIEverDeck = require('../../../src/content/decks/neverHaveIEver/prompts.json')
const cardCrimesBlackDeck = require('../../../src/content/decks/cardCrimes/black.json')
const cardCrimesWhiteDeck = require('../../../src/content/decks/cardCrimes/white.json')

const DECKS = {
  'fakinIt/behavior': behaviorDeck,
  'fakinIt/remote': remoteDeck,
  'dirtyDrawful/drawing': drawingDeck,
  'dirtyDrawful/hostLines': hostLinesDeck,
  'letMeFinish/questions': questionsDeck,
  'letMeFinish/challengerPrompts': challengerDeck,
  'truthOrCube/truths': tocTruthsDeck,
  'truthOrCube/dares': tocDaresDeck,
  'captionClash/prompts': captionClashDeck,
  'bluffBox/prompts': bluffBoxDeck,
  'triviaToss/questions': triviaTossDeck,
  'categories/prompts': categoriesDeck,
  'doodle/words': doodleDeck,
  'wordBluff/words': wordBluffDeck,
  'wouldYouRather/prompts': wouldYouRatherDeck,
  'neverHaveIEver/prompts': neverHaveIEverDeck,
  'cardCrimes/black': cardCrimesBlackDeck,
  'cardCrimes/white': cardCrimesWhiteDeck,
}

function pickRandomItem(deckKey, { excludeIds = [], remoteOnly = false } = {}) {
  const deck = DECKS[deckKey]
  if (!deck?.items?.length) return null
  let pool = deck.items.filter((item) => !excludeIds.includes(item.id))
  if (remoteOnly) {
    pool = pool.filter((item) => item.remotePlaySafe === true)
  }
  if (pool.length === 0) {
    pool = deck.items.filter((item) => !excludeIds.includes(item.id))
  }
  if (pool.length === 0) pool = deck.items
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Return up to n unique items from a deck, shuffled. Falls back to repeats only if the deck is too small. */
function sampleItems(deckKey, n, excludeIds = []) {
  const deck = DECKS[deckKey]
  if (!deck?.items?.length) return []
  let pool = deck.items.filter((item) => !excludeIds.includes(item.id))
  if (pool.length < n) pool = [...deck.items]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, n)
}

function pickHostLine(excludeIds = []) {
  return pickRandomItem('dirtyDrawful/hostLines', { excludeIds })
}

function pickChallengerLine(excludeIds = []) {
  return pickRandomItem('letMeFinish/challengerPrompts', { excludeIds })
}

module.exports = { pickRandomItem, sampleItems, pickHostLine, pickChallengerLine, DECKS }

const { setRoom } = require('./redis')
const { isStepComplete } = require('./stepComplete')
const { applyStepAdvance } = require('./stepAdvance')

/** Save room after player input; auto-advance when every connected player has answered. */
async function persistInputAndMaybeAdvance(roomId, room) {
  room.updatedAt = new Date().toISOString()
  await setRoom(roomId, room)

  if (room.phase === 'playing' && isStepComplete(room)) {
    applyStepAdvance(room)
    room.updatedAt = new Date().toISOString()
    await setRoom(roomId, room)
  }
}

module.exports = { persistInputAndMaybeAdvance }

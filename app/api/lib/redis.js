import { Redis } from '@upstash/redis'

const REDIS_KEY_PREFIX = 'jackcube:'
const ROOM_TTL_SEC = 86400
const MAX_PLAYERS = 8

const PLAYER_COLORS = [
  '#6C5CE7',
  '#00F5D4',
  '#FF6B6B',
  '#FFD93D',
  '#FF8C42',
  '#4ECDC4',
  '#A29BFE',
  '#FD79A8',
]

let redis = null

function getRedis() {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

function roomKey(roomId) {
  return `${REDIS_KEY_PREFIX}room:${roomId}`
}

function codeKey(gameCode) {
  return `${REDIS_KEY_PREFIX}code:${String(gameCode).toUpperCase()}`
}

function randomGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function pickColor(index) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}

async function getRoom(roomId) {
  const r = getRedis()
  if (!r) return null
  const raw = await r.get(roomKey(roomId))
  if (!raw) return null
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

async function setRoom(roomId, room) {
  const r = getRedis()
  if (!r) return
  await r.set(roomKey(roomId), JSON.stringify(room), { ex: ROOM_TTL_SEC })
}

function normalizePlayer(raw, index = 0) {
  if (typeof raw === 'string') {
    return {
      id: `legacy-${index}`,
      name: raw,
      color: pickColor(index),
      score: 0,
    }
  }
  return {
    id: raw.id || `p-${index}`,
    name: String(raw.name || 'Player').trim() || 'Player',
    color: raw.color || pickColor(index),
    score: Number(raw.score) || 0,
  }
}

export {
  getRedis,
  roomKey,
  codeKey,
  randomGameCode,
  getRoom,
  setRoom,
  pickColor,
  normalizePlayer,
  ROOM_TTL_SEC,
  MAX_PLAYERS,
  PLAYER_COLORS,
}

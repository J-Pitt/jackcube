# JackCube

Multiplayer party game — **TV/main screen for the show**, **phones as controllers**. Supports **online** (remote friends) and **local** (same-room WiFi) modes.

Built for **AWS Amplify** (Next.js API routes + Upstash Redis), matching the [truthordare](https://github.com) room pattern.

## Quick start

```bash
cd src/components/jackCube
cp env.example .env.local
# Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (same as truthordare)
npm install
npm run dev
```

Open [http://localhost:5180](http://localhost:5180)

## Flow

1. **Home** — pick Local or Online party
2. **Host** — create room, get QR + 4-letter code
3. **Join** — `/join?code=ABCD` on phones
4. **Lobby** — player list, **browser WebRTC video meet** (PeerJS), host starts game
5. **Cube Flap** — Flappy Bird minigame (`/game` on TV, `/play` on phones)
6. **3D Leaderboard** — React Three Fiber podium after each round

## Lobby video call

Uses **WebRTC via PeerJS** in the browser only (no media server). STUN: `stun.l.google.com`. Players opt in with **Join video call**; mic + camera with mute/camera-off toggles.

## Amplify deploy

1. Connect this folder as an Amplify app (or monorepo app root = `src/components/jackCube`)
2. Set environment variables in Amplify console:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_APP_URL` — your Amplify URL (for invite links & QR)
3. `amplify.yml` is included — writes Redis vars to `.env.production` at build time

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/jackcube/room` | GET | Poll room state |
| `/api/jackcube/room` | POST | Create room / update game state |
| `/api/jackcube/room/join` | POST | Join by code |
| `/api/jackcube/room/leave` | POST | Leave room |
| `/api/jackcube/room/input` | POST | Phone flap input |
| `/api/jackcube/room/end-round` | POST | Host ends round, scores |
| `/api/jackcube/room/next-round` | POST | Host starts next round |

Redis key prefix: `jackcube:`

# JackCube

Multiplayer party game — **TV/main screen for the show**, **phones as private controllers**. Supports **online** (remote friends) and **local** (same-room WiFi) modes.

Built for **AWS Amplify** (Next.js API routes + Upstash Redis).

## Quick start

```bash
cd src/components/jackCube
cp env.example .env.local
# Add UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
npm install
npm run dev
```

Open [http://localhost:5180](http://localhost:5180)

## 18+ mature games

Three adult party games ship with curated JSON prompt decks under `src/content/decks/`:

Adult games are **password-locked** on the home screen and TV host view. Set `ADULT_GAMES_PASSWORD` on the server (default dev password: `cube18`).

| Game | ID | Players | TV | Phone |
|------|-----|---------|-----|-------|
| Cube Flap | `flappy` | 2–8 | Host sim | Tap to flap |
| Truth or Cube | `truthOrCube` | 2–8 | Cube spin, truth/dare | Target: prompt + done/chicken |
| Fakin' It All Night Long | `fakinIt` | 3–8 | Timer, votes, reveal | Secret prompt / faker bluff |
| Dirty Drawful | `dirtyDrawful` | 3–8 | Live drawing, guesses | Draw + guess |
| Let Me Finish | `letMeFinish` | 3–8 | Question, ticker, votes | Pitch / objections / vote |

**Consent:** Mature games show an 18+ gate before lobby/play. Content is for consenting adults only.

**Privacy:** Secret prompts (faker instructions, draw prompts) are stored server-side in `gameState.secrets` and exposed only via `GET /api/jackcube/room/me?roomId=&playerId=`. Public room polls never include secrets until the reveal phase.

**Remote play:** Online Fakin' It defaults to `remotePlaySafe` deck items and on-phone gesture buttons. Host can enable "spicy remote" in lobby to allow physical prompts.

## Flow

1. **Home** — pick Local or Online party, or unlock **Adult games** (password) → `/adult-games`
2. **Host** — create room, get QR + 4-letter code
3. **Join** — `/join?code=ABCD` on phones
4. **Lobby** — pick game, player list, optional WebRTC video, host starts
5. **Game** — `/game` on TV, `/play` on phones (3-2-1 countdown, rounds, scoring)
6. **Leaderboard** — 3D podium after each round; first to target score wins (or 5 rounds for party games)

## Lobby video call

WebRTC via PeerJS (browser mesh, Google STUN). Optional — separate from game sync.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/jackcube/room` | GET | Poll room state (sanitized) |
| `/api/jackcube/room` | POST | Create room / host sync state |
| `/api/jackcube/adult/verify` | POST | Unlock adult games catalog (password) |
| `/api/jackcube/room/me` | GET | Private per-player view |
| `/api/jackcube/room/config` | POST | Host: gameId, spicyRemote, targetScore |
| `/api/jackcube/room/join` | POST | Join by code |
| `/api/jackcube/room/leave` | POST | Leave room |
| `/api/jackcube/room/start` | POST | Host starts game |
| `/api/jackcube/room/input` | POST | Phone actions (flap, vote, draw, etc.) |
| `/api/jackcube/room/advance` | POST | Host advances party-game steps |
| `/api/jackcube/room/end-round` | POST | Host ends round (Flappy) |
| `/api/jackcube/room/next-round` | POST | Host starts next round |

Redis key prefix: `jackcube:`

## Testing locally

1. `npm run dev`
2. Open host at `/host` → lobby → choose a game → start with 3+ browser tabs on `/join` + `/play`
3. Confirm secrets only on `/play` for assigned roles; TV shows public phases only
4. Regression: select **Cube Flap** in lobby and play a full round

## Amplify deploy

Set `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `NEXT_PUBLIC_APP_URL` in the Amplify console. See `amplify.yml`.
